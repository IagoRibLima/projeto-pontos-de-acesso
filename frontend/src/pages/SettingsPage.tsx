import { useState } from "react";
import type { FormEvent } from "react";

import type { Cenario, Configuracao, Modo } from "../api";
import { CoverageGrid } from "../components/CoverageGrid";
import { SectionTitle } from "../components/SectionTitle";

interface SettingsPageProps {
  config: Configuracao | null;
  scenario: Cenario | null;
  isLoading: boolean;
  onGenerate: (mode: Modo, seed: number | null) => Promise<void>;
}

export function SettingsPage({
  config,
  scenario,
  isLoading,
  onGenerate,
}: SettingsPageProps) {
  const [mode, setMode] = useState<Modo>("fixa");
  const [seed, setSeed] = useState("42");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedSeed =
      mode === "aleatoria" && seed !== "" ? Number(seed) : null;
    void onGenerate(mode, selectedSeed);
  }

  const scenarioDescription = scenario
    ? `Cenário carregado: ${scenario.modo === "fixa" ? "fixo" : "aleatório"}${
        scenario.semente === null ? "" : ` · semente ${scenario.semente}`
      }`
    : "Gere um cenário para visualizar a distribuição";

  return (
    <>
      <SectionTitle
        eyebrow="ETAPA 01"
        title="Configurações do problema"
        description="Escolha a distribuição inicial dos roteadores antes de aplicar os métodos de otimização."
      />

      <div className="two-column">
        <section className="panel settings-panel">
          <h2>Origem do cenário</h2>
          <p className="helper">
            Use as posições fixas de referência ou gere uma distribuição
            aleatória válida.
          </p>

          <form onSubmit={handleSubmit}>
            <fieldset disabled={isLoading || !config}>
              <div className="mode-options">
                <label
                  className={
                    mode === "fixa" ? "mode-option selected" : "mode-option"
                  }
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "fixa"}
                    onChange={() => setMode("fixa")}
                  />
                  <b>Cenário fixo</b>
                  <small>Posições de referência do projeto</small>
                </label>

                <label
                  className={
                    mode === "aleatoria"
                      ? "mode-option selected"
                      : "mode-option"
                  }
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "aleatoria"}
                    onChange={() => setMode("aleatoria")}
                  />
                  <b>Cenário aleatório</b>
                  <small>Um roteador por quadrante, mais um adicional</small>
                </label>
              </div>

              {config ? (
                <p className="helper">
                  Área: {config.tamanho} × {config.tamanho} ·{" "}
                  {config.quantidade_roteadores} roteadores · Alcance:{" "}
                  {config.alcance}
                  <br />
                  Bônus por ponto prioritário coberto: {config.peso_prioritario}
                  .
                </p>
              ) : (
                <p className="helper">Aguardando configuração da API.</p>
              )}

              {mode === "aleatoria" && (
                <label className="input-label">
                  Semente (opcional)
                  <input
                    type="number"
                    min="0"
                    max="4294967295"
                    step="1"
                    value={seed}
                    onChange={(event) => setSeed(event.target.value)}
                  />
                  <small>
                    A mesma semente repete as posições. Vazio gera um novo
                    sorteio.
                  </small>
                </label>
              )}

              <button className="primary full" type="submit">
                {isLoading ? "Processando…" : "Gerar cenário"} <b>→</b>
              </button>
            </fieldset>
          </form>
        </section>

        <section className="panel problem-panel">
          <div className="panel-heading">
            <div>
              <h2>Área de cobertura</h2>
              <p>{scenarioDescription}</p>
            </div>
            {config && (
              <span className="matrix-badge">
                {config.tamanho} × {config.tamanho}
              </span>
            )}
          </div>

          <div className="problem-description">
            <span>MAXIMIZAR</span>
            <strong>Soma dos sinais − sombras + bônus</strong>
            <p>
              O sinal diminui pela distância Manhattan; cada célula recebe o
              maior sinal disponível.
            </p>
          </div>

          {scenario ? (
            <CoverageGrid solution={scenario.solucao} />
          ) : (
            <p className="helper empty-hint">Nenhum cenário carregado.</p>
          )}
        </section>
      </div>
    </>
  );
}
