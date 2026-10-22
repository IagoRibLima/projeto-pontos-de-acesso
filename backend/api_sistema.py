"""API de distribuição de roteadores; os algoritmos ficam em funcoes.py."""

from contextlib import contextmanager
import math
from threading import Lock
from time import perf_counter
from typing import Annotated, Literal

from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend import funcoes

app = FastAPI(title="Distribuição de roteadores", version="1.0.0")
_execucao = Lock()
Coordenada = Annotated[int, Field(strict=True, ge=0, lt=funcoes.TAMANHO)]
Posicao = tuple[Coordenada, Coordenada]


class Entrada(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class CenarioCriar(Entrada):
    modo: Literal["fixa", "aleatoria"] = "fixa"
    semente: Annotated[int, Field(strict=True, ge=0, le=2**32 - 1)] | None = None


class ParametrosTempera(Entrada):
    temperatura_inicial: float = Field(default=100, gt=0, le=10000)
    temperatura_final: float = Field(default=0.1, ge=0.001)
    taxa_resfriamento: float = Field(default=0.95, gt=0, lt=1)
    iteracoes_por_temperatura: int = Field(default=100, strict=True, ge=1, le=1000)

    @model_validator(mode="after")
    def validar_custo(self):
        if self.temperatura_final >= self.temperatura_inicial:
            raise ValueError("A temperatura final deve ser menor que a inicial.")
        etapas = math.ceil(
            (math.log(self.temperatura_final) - math.log(self.temperatura_inicial))
            / math.log(self.taxa_resfriamento)
        )
        if etapas * self.iteracoes_por_temperatura > 50000:
            raise ValueError("A configuração excede o limite de 50.000 tentativas por execução.")
        return self


class BuscaCriar(Entrada):
    metodo: Literal["encosta", "tempera"]
    posicoes_iniciais: list[Posicao] = Field(
        min_length=funcoes.QUANTIDADE_ROTEADORES,
        max_length=funcoes.QUANTIDADE_ROTEADORES,
    )
    semente: Annotated[int, Field(strict=True, ge=0, le=2**32 - 1)] | None = None
    parametros_tempera: ParametrosTempera | None = None

    @model_validator(mode="after")
    def validar_cenario(self):
        if len(set(self.posicoes_iniciais)) != funcoes.QUANTIDADE_ROTEADORES:
            raise ValueError("Os roteadores devem ocupar células distintas.")
        if not funcoes.quadrantes_validos(self.posicoes_iniciais):
            raise ValueError("Cada quadrante deve conter ao menos um roteador.")
        if self.metodo == "encosta" and self.parametros_tempera is not None:
            raise ValueError("Parâmetros de têmpera só se aplicam ao método têmpera.")
        return self


class PontoCobertura(BaseModel):
    posicao: tuple[int, int]
    sinal: int


class Solucao(BaseModel):
    posicoes: list[tuple[int, int]]
    matriz: list[list[int]]
    pontuacao: int
    celulas_cobertas: int
    celulas_sem_cobertura: int
    cobertura_percentual: float
    quadrantes: dict[str, int]
    pontos_prioritarios: list[PontoCobertura]


class CenarioResposta(BaseModel):
    modo: Literal["fixa", "aleatoria"]
    semente: int | None
    solucao: Solucao


class BuscaResposta(BaseModel):
    metodo: Literal["encosta", "tempera"]
    semente: int | None
    parametros_tempera: ParametrosTempera | None
    inicial: Solucao
    resultado: Solucao
    melhoria: int
    tempo_segundos: float


@contextmanager
def execucao_isolada(semente):
    # As funções usam random global: serializa chamadas e restaura seu estado.
    with _execucao:
        estado = funcoes.rd.getstate()
        try:
            funcoes.rd.seed(semente)
            yield
        finally:
            funcoes.rd.setstate(estado)


def descrever_solucao(posicoes, matriz, pontuacao):
    total = funcoes.TAMANHO**2
    cobertas = sum(valor > 0 for linha in matriz for valor in linha)
    quadrantes = {q: 0 for q in ("Q1", "Q2", "Q3", "Q4")}
    for linha, coluna in posicoes:
        quadrantes[funcoes.identificar_quadrante(linha, coluna)] += 1
    return Solucao(
        posicoes=posicoes, matriz=matriz, pontuacao=pontuacao,
        celulas_cobertas=cobertas, celulas_sem_cobertura=total - cobertas,
        cobertura_percentual=round(cobertas / total * 100, 2),
        quadrantes=quadrantes,
        pontos_prioritarios=[
            PontoCobertura(posicao=(x, y), sinal=matriz[x][y])
            for x, y in funcoes.PONTOS_PRIORITARIOS
        ],
    )


@app.get("/api/configuracao")
def configuracao():
    return {
        "tamanho": funcoes.TAMANHO,
        "quantidade_roteadores": funcoes.QUANTIDADE_ROTEADORES,
        "alcance": funcoes.ALCANCE,
        "pontos_prioritarios": funcoes.PONTOS_PRIORITARIOS,
        "peso_prioritario": funcoes.PESO_PRIORITARIO,
        "metodos": ["encosta", "tempera"],
    }


@app.post("/api/cenarios", response_model=CenarioResposta)
def criar_cenario(entrada: CenarioCriar):
    with execucao_isolada(entrada.semente):
        roteador = funcoes.roteador(funcoes.ALCANCE)
        if entrada.modo == "fixa":
            dados = funcoes.teste_fixo(roteador)
        else:
            dados = funcoes.teste_aleatorio(roteador, semente=entrada.semente)
        return CenarioResposta(
            modo=entrada.modo, semente=entrada.semente if entrada.modo == "aleatoria" else None,
            solucao=descrever_solucao(*dados),
        )


@app.post("/api/busca-local", response_model=BuscaResposta)
def executar_busca(entrada: BuscaCriar):
    with execucao_isolada(entrada.semente):
        inicio = perf_counter()
        roteador = funcoes.roteador(funcoes.ALCANCE)
        matriz = funcoes.criar_matriz_cobertura(entrada.posicoes_iniciais, roteador)
        inicial = descrever_solucao(entrada.posicoes_iniciais, matriz, funcoes.avaliar(matriz))
        parametros = None
        if entrada.metodo == "encosta":
            dados = funcoes.subida_encosta(roteador, entrada.posicoes_iniciais)
        else:
            parametros = entrada.parametros_tempera or ParametrosTempera()
            dados = funcoes.tempera_simulada(
                roteador, posicoes_iniciais=entrada.posicoes_iniciais,
                **parametros.model_dump(),
            )
        resultado = descrever_solucao(*dados)
        return BuscaResposta(
            metodo=entrada.metodo, semente=entrada.semente, parametros_tempera=parametros,
            inicial=inicial, resultado=resultado,
            melhoria=resultado.pontuacao - inicial.pontuacao,
            tempo_segundos=round(perf_counter() - inicio, 6),
        )
