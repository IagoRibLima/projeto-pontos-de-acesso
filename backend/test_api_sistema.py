"""Execute na raiz: python -m unittest backend.test_api_sistema."""
from concurrent.futures import ThreadPoolExecutor
from contextlib import redirect_stdout
from io import StringIO
import unittest

from fastapi.testclient import TestClient

from backend import funcoes
from backend.api_sistema import app


class ApiTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.saida = redirect_stdout(StringIO())
        self.saida.__enter__()

    def tearDown(self):
        self.client.close()
        self.saida.__exit__(None, None, None)

    def cenario(self, **dados):
        resposta = self.client.post('/api/cenarios', json=dados)
        self.assertEqual(resposta.status_code, 200, resposta.text)
        return resposta.json()['solucao']

    def conferir_solucao(self, solucao):
        posicoes = [tuple(p) for p in solucao['posicoes']]
        self.assertEqual(len(set(posicoes)), 5)
        self.assertTrue(funcoes.quadrantes_validos(posicoes))
        matriz = funcoes.criar_matriz_cobertura(posicoes, funcoes.roteador(funcoes.ALCANCE))
        self.assertEqual(solucao['matriz'], matriz)
        self.assertEqual(solucao['pontuacao'], funcoes.avaliar(matriz))
        cobertas = sum(v > 0 for linha in matriz for v in linha)
        self.assertEqual(solucao['celulas_cobertas'], cobertas)
        self.assertEqual(solucao['celulas_sem_cobertura'], 64 - cobertas)
        self.assertEqual(solucao['cobertura_percentual'], round(cobertas / 64 * 100, 2))
        self.assertEqual(sum(solucao['quadrantes'].values()), 5)
        for ponto in solucao['pontos_prioritarios']:
            x, y = ponto['posicao']
            self.assertEqual(ponto['sinal'], matriz[x][y])

    def test_configuracao_e_cenario_fixo(self):
        config = self.client.get('/api/configuracao').json()
        self.assertEqual(config['tamanho'], funcoes.TAMANHO)
        self.assertEqual(config['metodos'], ['encosta', 'tempera'])
        solucao = self.cenario(modo='fixa')
        self.assertEqual(solucao['posicoes'], [[1, 1], [1, 6], [6, 1], [6, 6], [3, 4]])
        self.conferir_solucao(solucao)

    def test_semente_reproduzivel_e_isolada(self):
        estado = funcoes.rd.getstate()
        primeira = self.cenario(modo='aleatoria', semente=42)
        self.cenario(modo='aleatoria', semente=7)
        self.assertEqual(primeira, self.cenario(modo='aleatoria', semente=42))
        self.assertEqual(estado, funcoes.rd.getstate())
        self.conferir_solucao(primeira)

    def test_requisicoes_concorrentes(self):
        with ThreadPoolExecutor(max_workers=3) as executor:
            resultados = list(executor.map(lambda _: self.cenario(modo='aleatoria', semente=42), range(3)))
        self.assertTrue(all(r == resultados[0] for r in resultados))

    def test_metodos_preservam_cenario_e_melhoram_ou_mantem_pontuacao(self):
        inicial = self.cenario(modo='fixa')
        for metodo in ('encosta', 'tempera'):
            with self.subTest(metodo=metodo):
                pedido = {'metodo': metodo, 'posicoes_iniciais': inicial['posicoes'], 'semente': 42}
                resposta = self.client.post('/api/busca-local', json=pedido)
                self.assertEqual(resposta.status_code, 200, resposta.text)
                dados = resposta.json()
                self.assertEqual(dados['inicial'], inicial)
                self.conferir_solucao(dados['resultado'])
                self.assertGreaterEqual(dados['melhoria'], 0)
                self.assertGreaterEqual(dados['tempo_segundos'], 0)
                repetida = self.client.post('/api/busca-local', json=pedido).json()
                self.assertEqual(dados['resultado'], repetida['resultado'])

    def test_rejeita_posicoes_invalidas(self):
        validas = self.cenario()['posicoes']
        invalidas = [validas[:4], validas + [[0, 0]], [[-1, 1]] + validas[1:],
                     [[8, 1]] + validas[1:], [validas[1]] + validas[1:],
                     [[0, i] for i in range(5)], [[True, 1]] + validas[1:],
                     [[1.5, 1]] + validas[1:]]
        for posicoes in invalidas:
            with self.subTest(posicoes=posicoes):
                resposta = self.client.post('/api/busca-local', json={
                    'metodo': 'encosta', 'posicoes_iniciais': posicoes})
                self.assertEqual(resposta.status_code, 422)

    def test_rejeita_tempera_invalida_ou_excessiva(self):
        posicoes = self.cenario()['posicoes']
        for parametros in ({'taxa_resfriamento': 1}, {'taxa_resfriamento': 0},
                           {'temperatura_final': 100}, {'temperatura_final': 0},
                           {'iteracoes_por_temperatura': 0}, {'taxa_resfriamento': 0.999999},
                           {'iteracoes_por_temperatura': 1.5}):
            with self.subTest(parametros=parametros):
                resposta = self.client.post('/api/busca-local', json={
                    'metodo': 'tempera', 'posicoes_iniciais': posicoes,
                    'parametros_tempera': parametros})
                self.assertEqual(resposta.status_code, 422)

    def test_rejeita_metodos_e_configuracoes_nao_suportados(self):
        self.assertEqual(self.client.post('/api/cenarios', json={'tamanho': 10}).status_code, 422)
        self.assertEqual(self.client.post('/api/cenarios', json={'modo': 'outro'}).status_code, 422)
        for metodo in ('tentativas', 'geneticos'):
            self.assertEqual(self.client.post('/api/busca-local', json={
                'metodo': metodo, 'posicoes_iniciais': self.cenario()['posicoes']}).status_code, 422)


if __name__ == '__main__':
    unittest.main()
