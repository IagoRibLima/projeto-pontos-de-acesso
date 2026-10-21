import random as rd

def area(x, y):

    matriz = [[0 for _ in range(x)] for _ in range(y)]

    return matriz


class roteador:

    def __init__(self, alcance):

        self.alcance = alcance


def avaliar(matriz):

    linha = len(matriz)

    coluna = len(matriz[0])

    soma = 0

    sombra = 0

    for i in range(linha):

        for j in range(coluna):

            if matriz[i][j] == 0:

                sombra += 1

            else:

                soma += matriz[i][j]

    return soma - sombra


def solucao_inicial_aleatoria(roteador):

    x = rd.randint(3, 10)
    y = rd.randint(3, 10)

    matriz = area(x, y)

    six = rd.randint(1, x - 2)
    siy = rd.randint(1, y - 2)

    si = preencher(
        matriz,
        six,
        siy,
        roteador
    )

    vi = avaliar(si)

    return si, vi


def solucao_inicial_fixa(roteador):

    x = 7
    y = 7

    matriz = area(x, y)

    six = 3
    siy = 3

    si = preencher(
        matriz,
        six,
        siy,
        roteador
    )

    vi = avaliar(si)

    return si, vi


def solucao_inicial_rnd(roteador):

    x = rd.randint(3, 20)
    y = rd.randint(3, 20)

    matriz = area(x, y)

    x1 = rd.randint(1, x - 2)
    y1 = rd.randint(1, y - 2)

    si = preencher(
        matriz,
        x1,
        y1,
        roteador
    )

    vi = avaliar(si)

    return si, vi


def subida_encosta(si_x, si_y, matriz, roteador):

    # Posição atual do roteador
    atual_x = si_x
    atual_y = si_y

    # Cria a matriz da solução atual
    atual = area(
        len(matriz[0]),
        len(matriz)
    )

    # Preenche a matriz com a posição inicial
    atual = preencher(
        atual,
        atual_x,
        atual_y,
        roteador
    )

    # Avalia a solução inicial
    valor_atual = avaliar(atual)

    while True:

        # Gera os sucessores da posição atual
        lista = sucessores(
            atual_x,
            atual_y,
            matriz,
            roteador
        )

        # Encontra o melhor sucessor
        novo_x, novo_y, nova_matriz, novo_valor = max(
            lista,
            key=lambda x: x[3]
        )

        # Verifica se o melhor sucessor é realmente melhor
        if novo_valor > valor_atual:

            atual_x = novo_x
            atual_y = novo_y

            atual = nova_matriz

            valor_atual = novo_valor

            print(
                f"Melhoria: posição = "
                f"({atual_x}, {atual_y}), "
                f"valor = {valor_atual}"
            )

        else:
            break

    return atual_x, atual_y, atual, valor_atual


def preencher(matriz, eixo_x, eixo_y, roteador):

    linha = len(matriz)

    coluna = len(matriz[0])

    for i in range(linha):

        for j in range(coluna):

            # É utilizada a distância Manhattan:
            # |x1 - x2| + |y1 - y2|
            distancia = abs(i - eixo_x) + abs(j - eixo_y)

            valor = roteador.alcance - distancia

            if valor < 0:

                valor = 0

            matriz[i][j] = valor

    return matriz


def sucessores(atual_x, atual_y, matriz, roteador):

    sucessores = []

    linhas = len(matriz)

    colunas = len(matriz[0])

    movimentos = [
        (-1, 0),
        (1, 0),
        (0, -1),
        (0, 1)
    ]

    for dx, dy in movimentos:

        novo_x = atual_x + dx

        novo_y = atual_y + dy

        if 0 <= novo_x < linhas and 0 <= novo_y < colunas:

            nova_matriz = area(
                colunas,
                linhas
            )

            nova_matriz = preencher(
                nova_matriz,
                novo_x,
                novo_y,
                roteador
            )

            valor = avaliar(nova_matriz)

            sucessores.append(
                (
                    novo_x,
                    novo_y,
                    nova_matriz,
                    valor
                )
            )

            print(
                f"S{len(sucessores)} = "
                f"({novo_x}, {novo_y}) "
                f"V{len(sucessores)} = {valor}"
            )

    return sucessores


def subida1(si_x, si_y, matriz, roteador, tmax):

    atual_x = si_x

    atual_y = si_y

    atual = area(
        len(matriz[0]),
        len(matriz)
    )

    atual = preencher(
        atual,
        atual_x,
        atual_y,
        roteador
    )

    va = avaliar(atual)

    # Contador utilizado para controlar quantas vezes
    # consecutivas não encontramos uma solução melhor.
    t = 0

    i = 1

    while t < tmax:

        print(f"\n===== Iteração {i} =====")

        print(
            f"Posição atual: ({atual_x}, {atual_y})"
        )

        print(
            f"Valor atual: {va}"
        )

        lista = sucessores(
            atual_x,
            atual_y,
            matriz,
            roteador
        )

        if not lista:

            break

        # x[3] corresponde ao quarto elemento da tupla:
        # (novo_x, novo_y, nova_matriz, valor)
        # Como queremos maximizar a avaliação, usamos max().
        novo_x, novo_y, nova_matriz, vn = max(
            lista,
            key=lambda x: x[3]
        )

        print("\nMelhor sucessor:")

        print(
            f"Posição: ({novo_x}, {novo_y})"
        )

        print(
            f"Valor: {vn}"
        )

        if vn > va:

            atual_x = novo_x

            atual_y = novo_y

            atual = nova_matriz

            va = vn

            print("Melhoria encontrada!")

        else:

            t += 1

            print("Não houve melhoria.")

        i += 1

    return atual_x, atual_y, atual, va


matriz = area(7, 7)

r = roteador(5)

si_x = 3

si_y = 3

tmax = 3

resultado = subida1(
    si_x,
    si_y,
    matriz,
    r,
    tmax
)

x, y, matriz_final, valor_final = resultado



print("\n==========================")

print("RESULTADO FINAL")

print("==========================")

print("Posição:", (x, y))

print("Valor:", valor_final)

for linha in matriz_final:

    print(linha)
