import { useState } from "react";

import "./App.css";
import { FeedbackMessages } from "./components/FeedbackMessages";
import { Layout } from "./components/Layout";
import { useRouterSystem } from "./hooks/useRouterSystem";
import { LocalSearchPage } from "./pages/LocalSearchPage";
import { OverviewPage } from "./pages/OverviewPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { Section } from "./types/navigation";

function App() {
  const [section, setSection] = useState<Section>("principal");
  const system = useRouterSystem();

  return (
    <Layout currentSection={section} onNavigate={setSection}>
      <FeedbackMessages
        connectionError={system.connectionError}
        error={system.error}
        notice={system.notice}
        onCloseError={system.clearError}
        onCloseNotice={system.clearNotice}
        onReconnect={system.reconnect}
      />

      {section === "principal" && <OverviewPage onNavigate={setSection} />}

      {section === "configuracoes" && (
        <SettingsPage
          config={system.config}
          scenario={system.scenario}
          isLoading={system.isLoading}
          onGenerate={system.generateScenario}
        />
      )}

      {section === "busca-local" && (
        <LocalSearchPage
          config={system.config}
          scenario={system.scenario}
          result={system.result}
          isLoading={system.isLoading}
          onExecute={system.runSearch}
          onClearResult={system.clearResult}
        />
      )}
    </Layout>
  );
}

export default App;
