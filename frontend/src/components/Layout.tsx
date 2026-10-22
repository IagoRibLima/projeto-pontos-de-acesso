import type { ReactNode } from "react";

import { navigationItems } from "../types/navigation";
import type { Section } from "../types/navigation";

interface LayoutProps {
  currentSection: Section;
  onNavigate: (section: Section) => void;
  children: ReactNode;
}

export function Layout({ currentSection, onNavigate, children }: LayoutProps) {
  const currentLabel = navigationItems.find(
    (item) => item.id === currentSection,
  )?.label;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" aria-label="Símbolo do projeto">
          <div className="brand-mark">∿</div>
        </div>

        <nav aria-label="Navegação principal">
          <p className="nav-label">PROJETO</p>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={
                currentSection === item.id ? "nav-item active" : "nav-item"
              }
              onClick={() => onNavigate(item.id)}
            >
              <i>{item.icon}</i>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot" />
          Distribuição de roteadores
          <br />
          <span>Programação Linear</span>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="breadcrumb">
            Projeto <b>/</b> {currentLabel}
          </div>
        </header>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}
