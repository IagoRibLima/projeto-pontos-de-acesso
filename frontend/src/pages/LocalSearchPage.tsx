import { useState } from "react";
import type { FormEvent } from "react";

import type {
  Cenario,
  Configuracao,
  Metodo,
  ParametrosTempera,
  ResultadoBusca,
} from "../api";
import { NumberField } from "../components/NumberField";
import { SearchResult } from "../components/SearchResult";
import { SectionTitle } from "../components/SectionTitle";

interface LocalSearchPageProps {
  config: Configuracao | null;
  scenario: Cenario | null;
  result: ResultadoBusca | null;
  isLoading: boolean;
  onExecute: (
    method: Metodo,
    seed: number | null,
    parameters?: ParametrosTempera,
  ) => Promise<void>;
  onClearResult: () => void;
}

interface AnnealingForm {
  temperatura_inicial: string;
  temperatura_final: string;
  taxa_resfriamento: string;
  iteracoes_por_temperatura: string;
}

const defaultAnnealing: AnnealingForm = {
  temperatura_inicial: "100",
  temperatura_final: "0.1",
  taxa_resfriamento: "0.95",
  iteracoes_por_temperatura: "100",
};

export function LocalSearchPage({
  config,
  scenario,
  result,
  isLoading,
  onExecute,
  onClearResult,
}: LocalSearchPageProps) {
  const [method, setMethod] = useState<Metodo>("encosta");
  const [seed, setSeed] = useState("42");
  const [annealing, setAnnealing] = useState<AnnealingForm>(defaultAnnealing);

  function changeMethod(newMethod: Metodo) {
    setMethod(newMethod);
    onClearResult();
  }

  function changeAnnealingParameter(field: keyof AnnealingForm, value: string) {
    setAnnealing((current) => ({ ...current, [field]: value }));
    onClearResult();
  }

  function getAnnealingParameters(): ParametrosTempera | undefined {
    if (method !== "tempera") return undefined;

    return {
      temperatura_inicial: Number(annealing.temperatura_inicial),
      temperatura_final: Number(annealing.temperatura_final),
      taxa_resfriamento: Number(annealing.taxa_resfriamento),
      iteracoes_por_temperatura: Number(annealing.iteracoes_por_temperatura),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedSeed = seed === "" ? null : Number(seed);
    void onExecute(method, selectedSeed, getAnnealingParameters());
  }

  return (
    <>
      <SectionTitle
        eyebrow="ETAPA 02"
        title="Busca local"
        description="Execute o método a partir das posições do cenário carregado e compare a cobertura encontrada."
      />

      <section className="panel control-panel">
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isLoading}>
            <div className="form-grid">
              <label className="input-label">
                Método
                <select
                  value={method}
                  onChange={(event) =>
                    changeMethod(event.target.value as Metodo)
                  }
                >
                  <option value="encosta">Subida de encosta</option>
                  <option disabled>
                    Subida de encosta com tentativas — indisponível
                  </option>
                  <option value="tempera">Têmpera simulada</option>
                </select>
              </label>

              {method === "tempera" && (
                <>
                  <NumberField
                    label="Temperatura inicial"
                    value={annealing.temperatura_inicial}
                    onChange={(value) =>
                      changeAnnealingParameter("temperatura_inicial", value)
                    }
                    min={0.001}
                    max={10000}
                    step="any"
                  />
                  <NumberField
                    label="Temperatura final"
                    value={annealing.temperatura_final}
                    onChange={(value) =>
                      changeAnnealingParameter("temperatura_final", value)
                    }
                    min={0.001}
                    step="any"
                  />
                  <NumberField
                    label="Fator redutor"
                    value={annealing.taxa_resfriamento}
                    onChange={(value) =>
                      changeAnnealingParameter("taxa_resfriamento", value)
                    }
                    min={0.000001}
                    max={0.999999}
                    step="any"
                  />
                  <NumberField
                    label="Iterações por temperatura"
                    value={annealing.iteracoes_por_temperatura}
                    onChange={(value) =>
                      changeAnnealingParameter(
                        "iteracoes_por_temperatura",
                        value,
                      )
                    }
                    min={1}
                    max={1000}
                  />
                  <NumberField
                    label="Semente (opcional)"
                    value={seed}
                    onChange={(value) => {
                      setSeed(value);
                      onClearResult();
                    }}
                    min={0}
                    max={4294967295}
                    optional
                  />
                </>
              )}

              <div className="method-info">
                <b>
                  {method === "tempera"
                    ? "Exploração probabilística"
                    : "Busca gulosa"}
                </b>
                <span>
                  {method === "tempera"
                    ? "Aceita soluções piores de forma controlada e retorna a melhor encontrada."
                    : "Avança pela melhor solução da vizinhança."}
                </span>
              </div>
            </div>

            {!scenario && (
              <p className="helper">
                Gere um cenário em Configurações para habilitar a execução.
              </p>
            )}

            <div className="actions">
              <button
                className="primary"
                type="submit"
                disabled={!scenario || !config?.metodos.includes(method)}
              >
                {isLoading ? "Executando…" : "Executar método"} <b>→</b>
              </button>
            </div>
          </fieldset>
        </form>
      </section>

      <SearchResult result={result} isLoading={isLoading} />
    </>
  );
}
