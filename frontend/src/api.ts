export type Posicao = [number, number];
export type Modo = "fixa" | "aleatoria";
export type Metodo = "encosta" | "tempera";

export interface Configuracao {
  tamanho: number;
  quantidade_roteadores: number;
  alcance: number;
  pontos_prioritarios: Posicao[];
  peso_prioritario: number;
  metodos: Metodo[];
}

export interface Solucao {
  posicoes: Posicao[];
  matriz: number[][];
  pontuacao: number;
  celulas_cobertas: number;
  celulas_sem_cobertura: number;
  cobertura_percentual: number;
  quadrantes: Record<string, number>;
  pontos_prioritarios: { posicao: Posicao; sinal: number }[];
}

export interface Cenario {
  modo: Modo;
  semente: number | null;
  solucao: Solucao;
}

export interface ParametrosTempera {
  temperatura_inicial: number;
  temperatura_final: number;
  taxa_resfriamento: number;
  iteracoes_por_temperatura: number;
}

export interface ResultadoBusca {
  metodo: Metodo;
  semente: number | null;
  parametros_tempera: ParametrosTempera | null;
  inicial: Solucao;
  resultado: Solucao;
  melhoria: number;
  tempo_segundos: number;
}

async function requisicao<T>(
  caminho: string,
  opcoes?: RequestInit,
): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`/api${caminho}`, opcoes);
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === "AbortError") throw erro;
    throw new Error(
      "Não foi possível conectar à API. Verifique se o backend está em execução e tente novamente.",
      { cause: erro },
    );
  }
  if (!resposta.ok) {
    const erro = (await resposta.json().catch(() => null)) as {
      detail?: string | { msg: string; loc: (string | number)[] }[];
    } | null;
    const detalhe = erro?.detail;
    throw new Error(
      Array.isArray(detalhe)
        ? detalhe
            .map(
              (item) =>
                `${item.loc.slice(1).join(".") || "Dados"}: ${item.msg}`,
            )
            .join(" ")
        : typeof detalhe === "string"
          ? detalhe
          : "A API não respondeu corretamente. Verifique o backend e tente novamente.",
    );
  }
  return resposta.json() as Promise<T>;
}

const post = (dados: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(dados),
});

export const obterConfiguracao = (signal: AbortSignal) =>
  requisicao<Configuracao>("/configuracao", { signal });
export const criarCenario = (modo: Modo, semente: number | null) =>
  requisicao<Cenario>("/cenarios", post({ modo, semente }));
export const executarBusca = (
  metodo: Metodo,
  posicoes: Posicao[],
  semente: number | null,
  parametros?: ParametrosTempera,
) =>
  requisicao<ResultadoBusca>(
    "/busca-local",
    post({
      metodo,
      posicoes_iniciais: posicoes,
      semente,
      parametros_tempera: parametros,
    }),
  );
