## Executar localmente

Na raiz do projeto, prepare o ambiente Python (Python 3.10 ou superior):

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
python -m uvicorn backend.api_sistema:app --reload --host 127.0.0.1 --port 8000
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente `http://localhost:5173`. O Vite encaminha `/api` para `http://127.0.0.1:8000`, inclusive no modo `npm run preview`. A documentação interativa da API está em `http://127.0.0.1:8000/docs`.

Em uma hospedagem de produção, configure o servidor para encaminhar `/api` ao backend; o build estático não inclui um servidor Python.

## Fluxo

1. Em **Configurações**, gere um cenário fixo ou aleatório. A semente é opcional: um número repete o sorteio; vazio produz um novo sorteio.
2. Em **Busca local**, execute subida de encosta ou têmpera simulada. Os dois métodos partem das posições do cenário carregado, permitindo comparar resultados a partir da mesma distribuição inicial.
3. Confira as matrizes inicial e final, posições, quadrantes, pontos prioritários, pontuação, cobertura e tempo de processamento.

O cenário atual usa área 8 × 8, cinco roteadores distintos, alcance 5, pelo menos um roteador em cada quadrante e bônus 10 por ponto prioritário coberto. As coordenadas são `(linha, coluna)`, de 0 a 7. O sinal usa distância Manhattan e cada célula mantém o maior sinal disponível. A pontuação é a soma dos sinais menos a quantidade de células sem cobertura, mais os bônus.

O tamanho é fixo porque a geração de posições em `funcoes.py` usa os limites dos quatro quadrantes da área 8 × 8. A API não modifica constantes nem reimplementa os algoritmos. A interface oferece somente os dois métodos implementados: subida de encosta e têmpera simulada. Não é exibido um histórico de iterações, pois as funções retornam somente a solução final.

## API

- `GET /api/configuracao`: regras atuais e métodos disponíveis.
- `POST /api/cenarios`: recebe `modo` (`fixa` ou `aleatoria`) e `semente` opcional; retorna posições, matriz e métricas.
- `POST /api/busca-local`: recebe `metodo` (`encosta` ou `tempera`), `posicoes_iniciais`, `semente` opcional e `parametros_tempera` quando aplicável; retorna as soluções inicial e final, melhoria e tempo.

Exemplo de geração:

```json
{"modo": "aleatoria", "semente": 42}
```

Exemplo de busca:

```json
{
  "metodo": "tempera",
  "posicoes_iniciais": [[1, 1], [1, 6], [6, 1], [6, 6], [3, 4]],
  "semente": 42,
  "parametros_tempera": {
    "temperatura_inicial": 100,
    "temperatura_final": 0.1,
    "taxa_resfriamento": 0.95,
    "iteracoes_por_temperatura": 100
  }
}
```

Entradas inválidas retornam HTTP 422. A têmpera exige temperaturas positivas, temperatura final menor que a inicial, fator entre 0 e 1 e no máximo 50.000 tentativas calculadas por requisição. As chamadas aos algoritmos são serializadas por processo e o estado aleatório é restaurado entre requisições. Não há persistência: recarregar a página limpa o cenário e os resultados.

## Verificações

```bash
python -m unittest backend.test_api_sistema -v
cd frontend
npm run build
npm run lint
```

Os testes cobrem cenários, métricas, os dois métodos, repetibilidade, chamadas simultâneas e rejeição de posições/parâmetros inválidos.
