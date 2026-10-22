import { SectionTitle } from "../components/SectionTitle";
import type { Section } from "../types/navigation";

interface OverviewPageProps {
  onNavigate: (section: Section) => void;
}

export function OverviewPage({ onNavigate }: OverviewPageProps) {
  return (
    <>
      <section className="welcome-card">
        <div>
          <span className="eyebrow">PESQUISA OPERACIONAL · 2026</span>
          <h1>
            Distribua roteadores.
            <br />
            <em>Melhore a cobertura.</em>
          </h1>
          <p>
            Explore posições para cinco roteadores em uma área 8 × 8, mantendo
            os quatro quadrantes ocupados e valorizando os pontos prioritários.
          </p>
          <button
            className="primary"
            onClick={() => onNavigate("configuracoes")}
          >
            Começar configuração <b>→</b>
          </button>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
          <div className="node center-node">Wi-Fi</div>
          <div className="node node-one">R₁</div>
          <div className="node node-two">R₂</div>
          <div className="node node-three">R₃</div>
          <div className="curve" />
        </div>
      </section>

      <section className="about">
        <SectionTitle
          eyebrow="SOBRE O TRABALHO"
          title="Otimização, na prática."
          description="Compare a distribuição inicial com a solução encontrada pelos métodos de busca para melhorar o sinal na área."
        />
        <div className="steps">
          <article>
            <span>01</span>
            <h3>Prepare o cenário</h3>
            <p>Gere uma distribuição fixa ou aleatória de cinco roteadores.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Explore soluções</h3>
            <p>
              Execute subida de encosta ou têmpera simulada a partir do cenário
              carregado.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Compare resultados</h3>
            <p>Confira pontuação, cobertura, posições e tempo de execução.</p>
          </article>
        </div>
      </section>
    </>
  );
}
