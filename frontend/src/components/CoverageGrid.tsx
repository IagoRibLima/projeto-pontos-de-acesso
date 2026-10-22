import type { Solucao } from "../api";

interface CoverageGridProps {
  solution: Solucao;
}

function getCellClass(
  signal: number,
  routerIndex: number,
  isPriority: boolean,
  row: number,
  column: number,
  size: number,
) {
  return [
    signal === 0 ? "shadow-cell" : "covered-cell",
    routerIndex >= 0 ? "router-cell" : "",
    isPriority ? "priority-cell" : "",
    row === size / 2 ? "quadrant-top" : "",
    column === size / 2 ? "quadrant-left" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function CoverageGrid({ solution }: CoverageGridProps) {
  const size = solution.matriz.length;

  return (
    <div className="coverage">
      <div className="matrix-wrap">
        <table className="coverage-table">
          <caption>
            Matriz de sinal · coordenadas (linha, coluna) de 0 a {size - 1}
          </caption>
          <thead>
            <tr>
              <th scope="col">L / C</th>
              {solution.matriz[0].map((_, column) => (
                <th scope="col" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {solution.matriz.map((line, row) => (
              <tr key={row}>
                <th scope="row">{row}</th>
                {line.map((signal, column) => {
                  const routerIndex = solution.posicoes.findIndex(
                    ([routerRow, routerColumn]) =>
                      routerRow === row && routerColumn === column,
                  );
                  const isPriority = solution.pontos_prioritarios.some(
                    ({ posicao: [priorityRow, priorityColumn] }) =>
                      priorityRow === row && priorityColumn === column,
                  );
                  const details = [
                    `Linha ${row}, coluna ${column}: sinal ${signal}`,
                    routerIndex >= 0 ? `roteador ${routerIndex + 1}` : "",
                    isPriority ? "ponto prioritário" : "",
                  ]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <td
                      key={column}
                      className={getCellClass(
                        signal,
                        routerIndex,
                        isPriority,
                        row,
                        column,
                        size,
                      )}
                      title={details}
                    >
                      <span>{signal}</span>
                      {routerIndex >= 0 && <small>R{routerIndex + 1}</small>}
                      {isPriority && <b aria-label="Ponto prioritário">★</b>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="coverage-legend">
        R = roteador · ★ = ponto prioritário · 0 = sem cobertura
        <br />
        Quadrantes: Q1 superior esquerdo, Q2 superior direito, Q3 inferior
        esquerdo, Q4 inferior direito.
      </p>

      <div className="solution-details">
        <p>
          <b>Posições:</b>{" "}
          {solution.posicoes
            .map(([row, column], index) => `R${index + 1}: (${row}, ${column})`)
            .join(" · ")}
        </p>
        <p>
          <b>Por quadrante:</b>{" "}
          {Object.entries(solution.quadrantes)
            .map(([quadrant, total]) => `${quadrant}: ${total}`)
            .join(" · ")}
        </p>
        <p>
          <b>Pontos prioritários:</b>{" "}
          {solution.pontos_prioritarios
            .map(
              ({ posicao: [row, column], sinal }) =>
                `(${row}, ${column}): sinal ${sinal}`,
            )
            .join(" · ")}
        </p>
        <p>
          <b>Pontuação:</b> {solution.pontuacao} · <b>Cobertura:</b>{" "}
          {solution.celulas_cobertas}/{size ** 2} (
          {solution.cobertura_percentual}%)
          {" · "}
          <b>Sombras:</b> {solution.celulas_sem_cobertura}
        </p>
      </div>
    </div>
  );
}
