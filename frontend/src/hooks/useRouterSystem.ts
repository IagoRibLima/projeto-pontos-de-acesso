import { useEffect, useState } from "react";

import { criarCenario, executarBusca, obterConfiguracao } from "../api";
import type {
  Cenario,
  Configuracao,
  Metodo,
  Modo,
  ParametrosTempera,
  ResultadoBusca,
} from "../api";
import { getErrorMessage } from "../utils/errors";

export function useRouterSystem() {
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [scenario, setScenario] = useState<Cenario | null>(null);
  const [result, setResult] = useState<ResultadoBusca | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [connectionAttempt, setConnectionAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    obterConfiguracao(controller.signal)
      .then((configuration) => {
        setConfig(configuration);
        setConnectionError("");
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) {
          setConnectionError(getErrorMessage(failure));
        }
      });

    return () => controller.abort();
  }, [connectionAttempt]);

  function beginRequest() {
    setIsLoading(true);
    setError("");
    setNotice("");
  }

  async function generateScenario(mode: Modo, seed: number | null) {
    if (isLoading) return;

    beginRequest();
    setResult(null);

    try {
      const newScenario = await criarCenario(mode, seed);
      setScenario(newScenario);
      setNotice(
        `Cenário ${newScenario.modo === "fixa" ? "fixo" : "aleatório"} ` +
          "carregado para distribuição dos roteadores.",
      );
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setIsLoading(false);
    }
  }

  async function runSearch(
    method: Metodo,
    seed: number | null,
    parameters?: ParametrosTempera,
  ) {
    if (!scenario || isLoading) return;

    beginRequest();
    setResult(null);

    try {
      const searchResult = await executarBusca(
        method,
        scenario.solucao.posicoes,
        seed,
        parameters,
      );
      setResult(searchResult);
      setNotice(
        "Busca concluída. A distribuição encontrada está disponível abaixo.",
      );
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setIsLoading(false);
    }
  }

  function reconnect() {
    setConnectionError("");
    setConnectionAttempt((attempt) => attempt + 1);
  }

  return {
    config,
    scenario,
    result,
    isLoading,
    notice,
    error,
    connectionError,
    generateScenario,
    runSearch,
    reconnect,
    clearResult: () => setResult(null),
    clearNotice: () => setNotice(""),
    clearError: () => setError(""),
  };
}
