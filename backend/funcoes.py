# Importa funções para sorteio de posições.
import random as rd
# Importa cópia profunda para preservar a melhor matriz.
import copy as co
# Importa exponencial para a probabilidade da têmpera simulada.
import math

# Define o tamanho da matriz quadrada.
TAMANHO = 8
# Define o número de roteadores.
QUANTIDADE_ROTEADORES = 5
# Define o alcance usado na fórmula do sinal.
ALCANCE = 5
# Define as células prioritárias no formato (linha, coluna).
PONTOS_PRIORITARIOS = [(1, 1), (2, 6), (5, 2), (6, 6)]
# Define o bônus por ponto prioritário coberto.
PESO_PRIORITARIO = 10


# Cria uma matriz com y linhas e x colunas.
def area(x, y):
    # Inicializa todas as células com zero.
    return [[0 for _ in range(x)] for _ in range(y)]


# Representa um roteador.
class roteador:
    # Recebe o alcance ao criar o objeto.
    def __init__(self, alcance):
        # Guarda o alcance no objeto.
        self.alcance = alcance


# Descobre o quadrante de uma coordenada.
def identificar_quadrante(x, y):
    # Identifica o quadrante superior esquerdo.
    if x < TAMANHO // 2 and y < TAMANHO // 2:
        return "Q1"
    # Identifica o quadrante superior direito.
    elif x < TAMANHO // 2 and y >= TAMANHO // 2:
        return "Q2"
    # Identifica o quadrante inferior esquerdo.
    elif x >= TAMANHO // 2 and y < TAMANHO // 2:
        return "Q3"
    # As demais coordenadas pertencem ao quadrante inferior direito.
    return "Q4"


# Verifica se os quatro quadrantes possuem ao menos um roteador.
def quadrantes_validos(posicoes):
    # Monta o conjunto de quadrantes ocupados, sem duplicatas.
    quadrantes = {identificar_quadrante(x, y) for x, y in posicoes}
    # Retorna True quando há exatamente quatro quadrantes representados.
    return len(quadrantes) == 4


# Calcula a pontuação de uma matriz.
def avaliar(matriz):
    # Obtém a quantidade de linhas.
    linhas = len(matriz)
    # Obtém a quantidade de colunas.
    colunas = len(matriz[0])
    # Inicializa a soma dos sinais.
    soma = 0
    # Inicializa a contagem de células sem cobertura.
    sombra = 0

    # Percorre todas as linhas.
    for i in range(linhas):
        # Percorre todas as colunas da linha atual.
        for j in range(colunas):
            # Conta células sem sinal.
            if matriz[i][j] == 0:
                sombra += 1
            # Soma o sinal das células cobertas.
            else:
                soma += matriz[i][j]

    # Aplica a avaliação original: sinais menos células sem cobertura.
    pontuacao = soma - sombra

    # Percorre os pontos prioritários.
    for x, y in PONTOS_PRIORITARIOS:
        # Confere se o ponto está dentro da matriz.
        if 0 <= x < linhas and 0 <= y < colunas:
            # Concede bônus quando o ponto tem sinal positivo.
            if matriz[x][y] > 0:
                pontuacao += PESO_PRIORITARIO

    # Retorna a avaliação final.
    return pontuacao


# Preenche a matriz com a cobertura de um roteador.
def preencher(matriz, eixo_x, eixo_y, roteador_obj):
    # Obtém a quantidade de linhas.
    linhas = len(matriz)
    # Obtém a quantidade de colunas.
    colunas = len(matriz[0])

    # Percorre cada linha da matriz.
    for i in range(linhas):
        # Percorre cada coluna.
        for j in range(colunas):
            # Calcula a distância Manhattan entre a célula e o roteador.
            distancia = abs(i - eixo_x) + abs(j - eixo_y)
            # Calcula o sinal e impede que fique negativo.
            valor = max(0, roteador_obj.alcance - distancia)
            # Preserva o maior sinal quando vários roteadores cobrem a mesma célula.
            if valor > matriz[i][j]:
                matriz[i][j] = valor

    # Devolve a matriz atualizada.
    return matriz


# Combina a cobertura de todos os roteadores.
def criar_matriz_cobertura(posicoes, roteador_obj):
    # Cria uma matriz inicialmente sem cobertura.
    matriz = area(TAMANHO, TAMANHO)
    # Percorre as posições dos roteadores.
    for x, y in posicoes:
        # Aplica a cobertura do roteador atual.
        preencher(matriz, x, y, roteador_obj)
    # Retorna a cobertura combinada.
    return matriz


# Gera uma solução aleatória com todos os quadrantes ocupados.
def gerar_posicoes_iniciais():
    # Define os limites de linha e coluna dos quatro quadrantes.
    limites = [(0, 3, 0, 3), (0, 3, 4, 7), (4, 7, 0, 3), (4, 7, 4, 7)]
    # Cria a lista vazia de posições.
    posicoes = []
    # Percorre os limites de cada quadrante.
    for x_min, x_max, y_min, y_max in limites:
        # Sorteia uma posição dentro do quadrante atual.
        posicoes.append((rd.randint(x_min, x_max), rd.randint(y_min, y_max)))
    # Lista todas as células que ainda não foram ocupadas.
    vagas = [(x, y) for x in range(TAMANHO) for y in range(TAMANHO) if (x, y) not in posicoes]
    # Sorteia uma célula livre para o quinto roteador.
    posicoes.append(rd.choice(vagas))
    # Devolve as cinco posições.
    return posicoes


# Gera vizinhos para o modo antigo (um roteador) ou para vários roteadores.
def sucessores(atual_x, atual_y, matriz, roteador_obj):
    # Inicializa a lista de sucessores.
    lista = []
    # Obtém a quantidade de linhas.
    linhas = len(matriz)
    # Obtém a quantidade de colunas.
    colunas = len(matriz[0])

    # Detecta a chamada antiga com coordenadas inteiras.
    if isinstance(atual_x, int) and isinstance(atual_y, int):
        # Define os movimentos ortogonais possíveis.
        movimentos = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        # Percorre os movimentos.
        for dx, dy in movimentos:
            # Calcula a nova linha.
            nx = atual_x + dx
            # Calcula a nova coluna.
            ny = atual_y + dy
            # Ignora posições fora da matriz.
            if 0 <= nx < linhas and 0 <= ny < colunas:
                # Cria uma matriz vazia para o sucessor.
                nova = area(colunas, linhas)
                # Calcula a cobertura do roteador nessa posição.
                preencher(nova, nx, ny, roteador_obj)
                # Avalia a cobertura.
                valor = avaliar(nova)
                # Guarda coordenadas, matriz e valor.
                lista.append((nx, ny, nova, valor))
        # Devolve os sucessores do modo antigo.
        return lista

    # Trata atual_x como a lista de posições dos cinco roteadores.
    posicoes = atual_x
    # Cria um conjunto das posições ocupadas.
    ocupadas = set(posicoes)
    # Percorre cada roteador que pode ser movido.
    for indice in range(len(posicoes)):
        # Percorre as linhas candidatas.
        for x in range(linhas):
            # Percorre as colunas candidatas.
            for y in range(colunas):
                # Cria a coordenada de destino.
                destino = (x, y)
                # Ignora células ocupadas.
                if destino in ocupadas:
                    continue
                # Copia a solução atual.
                novo = posicoes.copy()
                # Move apenas o roteador selecionado.
                novo[indice] = destino
                # Rejeita movimentos que deixem algum quadrante vazio.
                if not quadrantes_validos(novo):
                    continue
                # Calcula a cobertura da nova disposição.
                nova_matriz = criar_matriz_cobertura(novo, roteador_obj)
                # Calcula a pontuação da nova disposição.
                valor = avaliar(nova_matriz)
                # Adiciona o sucessor válido.
                lista.append((novo, nova_matriz, valor))
    # Retorna todos os sucessores válidos.
    return lista


# Executa subida de encosta para cinco roteadores.
def subida_encosta(roteador_obj, posicoes_iniciais=None):
    # Usa uma cópia da solução recebida ou gera uma solução inicial.
    posicoes = posicoes_iniciais.copy() if posicoes_iniciais is not None else gerar_posicoes_iniciais()
    # Calcula a cobertura inicial.
    matriz_atual = criar_matriz_cobertura(posicoes, roteador_obj)
    # Avalia a solução inicial.
    valor_atual = avaliar(matriz_atual)
    # Inicializa o contador de melhorias.
    iteracao = 0
    # Mostra a posição inicial.
    print("\n=== SUBIDA DE ENCOSTA ===")
    # Mostra a avaliação inicial.
    print("Avaliação inicial:", valor_atual)

    # Continua até não encontrar melhoria.
    while True:
        # Gera os sucessores da solução atual.
        lista = sucessores(posicoes, None, matriz_atual, roteador_obj)
        # Para caso não existam sucessores.
        if not lista:
            break
        # Seleciona o sucessor de maior pontuação.
        melhor_posicoes, melhor_matriz, melhor_valor = max(lista, key=lambda item: item[2])
        # Para se o melhor sucessor não superar a solução atual.
        if melhor_valor <= valor_atual:
            break
        # Atualiza as posições atuais.
        posicoes = melhor_posicoes
        # Atualiza a matriz atual.
        matriz_atual = melhor_matriz
        # Atualiza a pontuação atual.
        valor_atual = melhor_valor
        # Conta uma iteração com melhoria.
        iteracao += 1
        # Exibe o progresso.
        print(f"Iteração {iteracao}: avaliação={valor_atual}; posições={posicoes}")

    # Retorna a solução encontrada.
    return posicoes, matriz_atual, valor_atual


# Gera uma vizinha aleatória válida para a têmpera simulada.
def gerar_sucessor_tempera(atual, roteador_obj):
    # Cria uma lista de índices de roteadores.
    indices = list(range(len(atual)))
    # Embaralha os roteadores para escolher a ordem de tentativa.
    rd.shuffle(indices)
    # Guarda as posições ocupadas.
    ocupadas = set(atual)
    # Tenta mover cada roteador.
    for indice in indices:
        # Lista as células livres.
        vagas = [(x, y) for x in range(TAMANHO) for y in range(TAMANHO) if (x, y) not in ocupadas]
        # Embaralha os destinos.
        rd.shuffle(vagas)
        # Testa cada destino.
        for destino in vagas:
            # Copia a solução.
            novo = atual.copy()
            # Move o roteador selecionado.
            novo[indice] = destino
            # Aceita somente soluções com todos os quadrantes ocupados.
            if quadrantes_validos(novo):
                # Calcula a cobertura candidata.
                matriz = criar_matriz_cobertura(novo, roteador_obj)
                # Devolve a candidata e sua avaliação.
                return novo, matriz, avaliar(matriz)
    # Recalcula a matriz atual se não houver movimento válido.
    matriz = criar_matriz_cobertura(atual, roteador_obj)
    # Devolve a solução atual como alternativa.
    return atual.copy(), matriz, avaliar(matriz)


# Executa a têmpera simulada.
def tempera_simulada(roteador_obj, temperatura_inicial=100.0, temperatura_final=0.1, taxa_resfriamento=0.95, iteracoes_por_temperatura=100, posicoes_iniciais=None):
    # Usa posições fornecidas ou gera uma solução aleatória.
    atual = posicoes_iniciais.copy() if posicoes_iniciais is not None else gerar_posicoes_iniciais()
    # Calcula a matriz inicial.
    matriz_atual = criar_matriz_cobertura(atual, roteador_obj)
    # Avalia a solução inicial.
    valor_atual = avaliar(matriz_atual)
    # Guarda as posições da melhor solução conhecida.
    melhor = atual.copy()
    # Copia a matriz da melhor solução.
    melhor_matriz = co.deepcopy(matriz_atual)
    # Guarda a avaliação da melhor solução.
    melhor_valor = valor_atual
    # Inicializa a temperatura.
    temperatura = temperatura_inicial
    # Inicializa o contador de tentativas.
    iteracao = 0

    # Continua enquanto a temperatura não chegar ao limite final.
    while temperatura > temperatura_final:
        # Executa tentativas na temperatura atual.
        for _ in range(iteracoes_por_temperatura):
            # Gera uma solução vizinha.
            candidato, matriz_candidata, valor_candidato = gerar_sucessor_tempera(atual, roteador_obj)
            # Calcula a diferença de pontuação.
            diferenca = valor_candidato - valor_atual
            # Aceita melhorias ou aceita pioras de acordo com a probabilidade térmica.
            if diferenca >= 0 or rd.random() < math.exp(diferenca / temperatura):
                # Atualiza a solução corrente.
                atual = candidato
                # Atualiza a matriz corrente.
                matriz_atual = matriz_candidata
                # Atualiza a avaliação corrente.
                valor_atual = valor_candidato
            # Confere se a solução corrente é a melhor encontrada.
            if valor_atual > melhor_valor:
                # Copia as posições da melhor solução.
                melhor = atual.copy()
                # Copia a matriz da melhor solução.
                melhor_matriz = co.deepcopy(matriz_atual)
                # Atualiza a melhor pontuação.
                melhor_valor = valor_atual
            # Conta a tentativa executada.
            iteracao += 1
        # Resfria o sistema.
        temperatura *= taxa_resfriamento

    # Exibe a quantidade total de tentativas.
    print("Iterações da têmpera simulada:", iteracao)
    # Devolve a melhor solução encontrada.
    return melhor, melhor_matriz, melhor_valor


# Imprime posições, quadrantes, matriz e estatísticas.
def imprimir_resultado(posicoes, matriz, valor):
    # Imprime o título do relatório.
    print("\n==============================")
    # Identifica a seção do resultado.
    print("RESULTADO DO CENÁRIO")
    # Imprime o separador.
    print("==============================")
    # Enumera os roteadores a partir de 1.
    for numero, (x, y) in enumerate(posicoes, start=1):
        # Mostra coordenadas e quadrante de cada roteador.
        print(f"Roteador {numero}: linha={x}, coluna={y}, quadrante={identificar_quadrante(x, y)}")
    # Inicializa a contagem dos quatro quadrantes.
    quadrantes = {q: 0 for q in ("Q1", "Q2", "Q3", "Q4")}
    # Percorre todas as posições.
    for x, y in posicoes:
        # Conta o roteador em seu quadrante.
        quadrantes[identificar_quadrante(x, y)] += 1
    # Imprime o cabeçalho da contagem.
    print("\nRoteadores por quadrante:")
    # Percorre os quadrantes e suas contagens.
    for q, quantidade in quadrantes.items():
        # Mostra a contagem do quadrante.
        print(f"{q}: {quantidade}")
    # Imprime o cabeçalho da matriz.
    print("\nMatriz de cobertura:")
    # Percorre cada linha da matriz.
    for linha in matriz:
        # Imprime os valores alinhados.
        print(" ".join(f"{valor_celula:2d}" for valor_celula in linha))
    # Conta as células com sinal positivo.
    cobertas = sum(1 for x in range(TAMANHO) for y in range(TAMANHO) if matriz[x][y] > 0)
    # Exibe o total de células cobertas.
    print(f"\nCélulas cobertas: {cobertas}/{TAMANHO * TAMANHO}")
    # Exibe o total de células sem cobertura.
    print(f"Células sem cobertura: {TAMANHO * TAMANHO - cobertas}")
    # Exibe a avaliação final.
    print(f"Avaliação final: {valor}")
    # Imprime o cabeçalho dos pontos prioritários.
    print("\nCobertura dos pontos prioritários:")
    # Percorre os pontos prioritários.
    for x, y in PONTOS_PRIORITARIOS:
        # Exibe o sinal na coordenada prioritária.
        print(f"{(x, y)}: sinal {matriz[x][y]}")


# Executa o cenário fixo e documenta o teste de mesa no próprio código.
def teste_fixo(roteador_obj):
    # Mostra o título do cenário fixo.
    print("\n========== TESTE FIXO / TESTE DE MESA ==========")
    # Define as cinco posições fixas, distintas e distribuídas nos quadrantes.
    posicoes = [(1, 1), (1, 6), (6, 1), (6, 6), (3, 4)]

    # TESTE DE MESA — POSIÇÕES FIXAS:
    # R1=(1,1) em Q1; R2=(1,6) em Q2; R3=(6,1) em Q3.
    # R4=(6,6) em Q4; R5=(3,4) em Q2.
    # Para cada célula (i,j), cada roteador calcula:
    # distância = abs(i - linha_roteador) + abs(j - coluna_roteador).
    # sinal = max(0, ALCANCE - distância).
    # A matriz mantém o maior sinal produzido pelos roteadores.
    # soma = soma dos valores positivos da matriz.
    # sombra = número de células cujo valor é zero.
    # bônus = PESO_PRIORITARIO para cada ponto prioritário com sinal positivo.
    # pontuação final = soma - sombra + bônus.
    # Pontos prioritários: (1,1), (2,6), (5,2) e (6,6).
    # Os valores numéricos efetivos são impressos pelo programa, evitando
    # registrar resultados manuais que possam divergir do cálculo executado.

    # Confere se existem cinco roteadores.
    assert len(posicoes) == QUANTIDADE_ROTEADORES
    # Confere se todas as posições são distintas.
    assert len(set(posicoes)) == QUANTIDADE_ROTEADORES
    # Confere se todos os quadrantes estão ocupados.
    assert quadrantes_validos(posicoes)
    # Calcula a matriz de cobertura do cenário fixo.
    matriz = criar_matriz_cobertura(posicoes, roteador_obj)
    # Calcula a pontuação da matriz fixa.
    valor = avaliar(matriz)
    # Exibe o relatório do cenário fixo.
    imprimir_resultado(posicoes, matriz, valor)
    # Devolve os dados do cenário fixo.
    return posicoes, matriz, valor


# Executa o cenário aleatório com semente opcional.
def teste_aleatorio(roteador_obj, semente=42):
    # Mostra o título do cenário aleatório.
    print("\n========== TESTE ALEATÓRIO ==========")
    # Define a semente para permitir repetir a sequência pseudoaleatória.
    rd.seed(semente)
    # Gera cinco posições com todos os quadrantes ocupados.
    posicoes = gerar_posicoes_iniciais()
    # Confere a quantidade de roteadores gerados.
    assert len(posicoes) == QUANTIDADE_ROTEADORES
    # Confere se não há posições duplicadas.
    assert len(set(posicoes)) == QUANTIDADE_ROTEADORES
    # Confere se os quatro quadrantes estão representados.
    assert quadrantes_validos(posicoes)
    # Calcula a cobertura do cenário aleatório.
    matriz = criar_matriz_cobertura(posicoes, roteador_obj)
    # Calcula a pontuação do cenário aleatório.
    valor = avaliar(matriz)
    # Exibe o relatório do cenário aleatório.
    imprimir_resultado(posicoes, matriz, valor)
    # Devolve os dados do cenário aleatório.
    return posicoes, matriz, valor


# Executa a rotina principal somente quando este arquivo é iniciado diretamente.
if __name__ == "__main__":
    # Cria o objeto roteador usando o alcance configurado.
    r = roteador(ALCANCE)
    # Executa o teste de mesa com posições fixas.
    posicoes_fixas, matriz_fixa, valor_fixo = teste_fixo(r)
    # Executa o teste aleatório reproduzível com semente 42.
    posicoes_aleatorias, matriz_aleatoria, valor_aleatorio = teste_aleatorio(r, semente=42)
    # Imprime o título da comparação final.
    print("\n========== COMPARAÇÃO DOS TESTES ==========")
    # Mostra a pontuação do cenário fixo.
    print(f"Pontuação fixa: {valor_fixo}")
    # Mostra a pontuação do cenário aleatório.
    print(f"Pontuação aleatória: {valor_aleatorio}")
    # Mostra a diferença entre as pontuações.
    print(f"Diferença (fixo - aleatório): {valor_fixo - valor_aleatorio}")
