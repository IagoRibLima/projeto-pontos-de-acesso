import type { ResultadoBusca } from "../api";
import { CoverageGrid } from "./CoverageGrid";

const methodNames = {
  encosta: "Subida de encosta",
  tempera: "Têmpera simulada",
};

interface SearchResultProps {
  result: ResultadoBusca | null;
  isLoading: boolean;
}

export function SearchResult({ result, isLoading }: SearchResultProps) {
  if (!result) {
    return (
      <section className="result-empty" role="status">
        <div>⌁</div>
        <h2>
          {isLoading ? "Calculando a distribuição…" : "Aguardando execução"}
        </h2>
        <p>As posições, a cobertura e a pontuação aparecerão aqui.</p>
      </section>
    );
  }

  return (
    <section className="results">
      <div className="result-header">
        <div>
          <span className="eyebrow">DISTRIBUIÇÃO DOS ROTEADORES</span>
          <h2>{methodNames[result.metodo]}</h2>
        </div>
        <span className="success">● Concluído</span>
      </div>

      <div className="metric-cards">
        <article>
          <small>PONTUAÇÃO FINAL</small>
          <strong>{result.resultado.pontuacao}</strong>
          <span>
            Inicial: {result.inicial.pontuacao} · Melhoria: +{result.melhoria}
          </span>
        </article>
        <article>
          <small>COBERTURA</small>
          <strong>{result.resultado.cobertura_percentual}%</strong>
          <span>
            {result.resultado.celulas_cobertas} células cobertas ·{" "}
            {result.resultado.celulas_sem_cobertura} sem sinal
          </span>
        </article>
        <article>
          <small>TEMPO DE EXECUÇÃO</small>
          <strong>
            {result.tempo_segundos.toLocaleString("pt-BR", {
              maximumFractionDigits: 3,
            })}{" "}
            s
          </strong>
          <span>Processamento no backend</span>
        </article>
      </div>

      {result.parametros_tempera && (
        <p className="helper">
          Temperatura: {result.parametros_tempera.temperatura_inicial} →{" "}
          {result.parametros_tempera.temperatura_final} · Fator:{" "}
          {result.parametros_tempera.taxa_resfriamento} · Iterações por
          temperatura: {result.parametros_tempera.iteracoes_por_temperatura} ·
          Semente: {result.semente ?? "não definida"}
        </p>
      )}

      <div className="comparison">
        <section>
          <h3>Distribuição inicial</h3>
          <CoverageGrid solution={result.inicial} />
        </section>
        <section>
          <h3>Melhor distribuição encontrada</h3>
          <CoverageGrid solution={result.resultado} />
        </section>
      </div>
    </section>
  );
}
