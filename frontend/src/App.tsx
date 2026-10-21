import { useMemo, useState } from 'react'
import './App.css'

type Section = 'principal' | 'configuracoes' | 'busca-local' | 'geneticos'
type ExecutionMode = 'fixa' | 'aleatoria'
type LocalMethod = 'encosta' | 'tentativas' | 'tempera'

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: 'principal', label: 'Visão geral', icon: '⌂' },
  { id: 'configuracoes', label: 'Configurações', icon: '⚙' },
  { id: 'busca-local', label: 'Busca local', icon: '⌁' },
  { id: 'geneticos', label: 'Algoritmos genéticos', icon: '⌘' },
]

const sampleMatrix = [[7, 3, 6, 4], [5, 8, 2, 7], [4, 6, 9, 3]]

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="section-title"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
}

function App() {
  const [section, setSection] = useState<Section>('principal')
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('fixa')
  const [problemSize, setProblemSize] = useState(4)
  const [problemGenerated, setProblemGenerated] = useState(false)
  const [method, setMethod] = useState<LocalMethod>('encosta')
  const [localResult, setLocalResult] = useState(false)
  const [geneticResult, setGeneticResult] = useState(false)
  const [notice, setNotice] = useState('')
  const matrix = useMemo(() => !problemGenerated || executionMode === 'fixa' ? sampleMatrix : Array.from({ length: Math.min(problemSize, 7) }, (_, row) => Array.from({ length: Math.min(problemSize, 7) }, (_, column) => ((row * 13 + column * 7 + problemSize * 3) % 9) + 1)), [problemGenerated, executionMode, problemSize])
  const openReport = (title: string) => { setNotice(`Relatório de análise “${title}” preparado para exportação em PDF.`); window.setTimeout(() => window.print(), 200) }
  const generateProblem = () => { setProblemGenerated(true); setNotice(`Problema ${executionMode === 'fixa' ? 'fixo' : 'aleatório'} gerado e disponível para execução.`) }

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">∿</div><div><strong>ORBITA</strong><small>OTIMIZAÇÃO</small></div></div><nav aria-label="Navegação principal"><p className="nav-label">PROJETO</p>{navItems.map((item) => <button key={item.id} className={section === item.id ? 'nav-item active' : 'nav-item'} onClick={() => setSection(item.id)}><i>{item.icon}</i>{item.label}</button>)}</nav><div className="sidebar-footer"><div className="status-dot" />Ambiente de simulação<br /><span>Programação Linear</span></div></aside>
    <main><header className="topbar"><div className="breadcrumb">Projeto <b>/</b> {navItems.find((item) => item.id === section)?.label}</div><div className="header-actions"><span className="problem-pill"><i />{problemGenerated ? 'Problema carregado' : 'Sem problema ativo'}</span><button className="avatar" aria-label="Perfil">IL</button></div></header><div className="content">
      {notice && <div className="toast" role="status"><span>✓</span>{notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso">×</button></div>}
      {section === 'principal' && <Overview onNavigate={setSection} />}
      {section === 'configuracoes' && <Settings executionMode={executionMode} setExecutionMode={setExecutionMode} problemSize={problemSize} setProblemSize={setProblemSize} problemGenerated={problemGenerated} generateProblem={generateProblem} matrix={matrix} />}
      {section === 'busca-local' && <LocalSearch method={method} setMethod={setMethod} result={localResult} execute={() => { setLocalResult(true); setNotice('Busca local concluída com sucesso.') }} analyse={() => openReport('Busca local')} />}
      {section === 'geneticos' && <Genetic result={geneticResult} execute={() => { setGeneticResult(true); setNotice('Algoritmo genético concluído com sucesso.') }} analyse={() => openReport('Algoritmo genético')} />}
    </div></main>
  </div>
}

function Overview({ onNavigate }: { onNavigate: (section: Section) => void }) { return <>
  <section className="welcome-card"><div><span className="eyebrow">PESQUISA OPERACIONAL · 2026</span><h1>Encontre a melhor<br /><em>solução possível.</em></h1><p>Configure cenários, execute meta-heurísticas e compare resultados para apoiar decisões de otimização.</p><button className="primary" onClick={() => onNavigate('configuracoes')}>Começar configuração <b>→</b></button></div><div className="hero-visual"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="node center-node">ƒ(x)</div><div className="node node-one">x₁</div><div className="node node-two">x₂</div><div className="node node-three">x₃</div><div className="curve" /></div></section>
  <section className="about"><SectionTitle eyebrow="SOBRE O TRABALHO" title="Otimização, na prática." description="Uma interface para parametrizar problemas de programação linear e observar o comportamento de diferentes estratégias de busca." /><div className="steps"><article><span>01</span><h3>Modele o problema</h3><p>Defina ou gere os coeficientes, restrições e o tamanho da instância.</p></article><article><span>02</span><h3>Explore soluções</h3><p>Execute busca local ou algoritmos genéticos com os parâmetros desejados.</p></article><article><span>03</span><h3>Compare resultados</h3><p>Analise custo, tempo e evolução das soluções em um relatório.</p></article></div></section>
</> }

function Settings({ executionMode, setExecutionMode, problemSize, setProblemSize, problemGenerated, generateProblem, matrix }: { executionMode: ExecutionMode; setExecutionMode: (value: ExecutionMode) => void; problemSize: number; setProblemSize: (value: number) => void; problemGenerated: boolean; generateProblem: () => void; matrix: number[][] }) {
  const labels = ['x₁', 'x₂', 'x₃', 'x₄', 'x₅', 'x₆', 'x₇']
  return <><SectionTitle eyebrow="ETAPA 01" title="Configurações do problema" description="Escolha como a instância será definida antes de aplicar os métodos de otimização." /><div className="two-column"><section className="panel settings-panel"><h2>Origem da instância</h2><p className="helper">Selecione uma base fixa para testes comparáveis ou gere novos valores a cada execução.</p><div className="mode-options"><label className={executionMode === 'fixa' ? 'mode-option selected' : 'mode-option'}><input type="radio" checked={executionMode === 'fixa'} onChange={() => setExecutionMode('fixa')} /><b>Instância fixa</b><small>Dados de referência do projeto</small></label><label className={executionMode === 'aleatoria' ? 'mode-option selected' : 'mode-option'}><input type="radio" checked={executionMode === 'aleatoria'} onChange={() => setExecutionMode('aleatoria')} /><b>Instância aleatória</b><small>Valores gerados automaticamente</small></label></div><label className="input-label">Tamanho do problema <span>{executionMode === 'fixa' ? 'Indisponível para instância fixa' : `${problemSize} variáveis`}</span><input type="range" min="3" max="7" value={problemSize} disabled={executionMode === 'fixa'} onChange={(event) => setProblemSize(Number(event.target.value))} /></label><button className="primary full" onClick={generateProblem}>Gerar problema <b>→</b></button></section><section className="panel problem-panel"><div className="panel-heading"><div><h2>Área de exibição</h2><p>{problemGenerated ? 'Instância pronta para execução' : 'Prévia da instância de referência'}</p></div><span className="matrix-badge">{matrix.length} × {matrix[0].length}</span></div><div className="problem-description"><span>MINIMIZAR</span><strong>f(x) = 12x₁ + 8x₂ + 15x₃ + 10x₄</strong><p>Sujeito às restrições abaixo, com xᵢ ≥ 0.</p></div><div className="matrix-wrap"><table><thead><tr><th>Restrição</th>{matrix[0].map((_, index) => <th key={index}>{labels[index]}</th>)}<th>Limite</th></tr></thead><tbody>{matrix.map((row, rowIndex) => <tr key={rowIndex}><td>R{rowIndex + 1}</td>{row.map((value, index) => <td key={index}>{value}</td>)}<td className="limit">≤ {18 + rowIndex * 6}</td></tr>)}</tbody></table></div></section></div></>
}

function LocalSearch({ method, setMethod, result, execute, analyse }: { method: LocalMethod; setMethod: (value: LocalMethod) => void; result: boolean; execute: () => void; analyse: () => void }) { return <><SectionTitle eyebrow="ETAPA 02" title="Busca local" description="Configure a estratégia de exploração de vizinhança e execute o método selecionado." /><section className="panel control-panel"><div className="form-grid"><label className="input-label">Método<select value={method} onChange={(event) => setMethod(event.target.value as LocalMethod)}><option value="encosta">Subida de encosta</option><option value="tentativas">Subida de encosta com tentativas</option><option value="tempera">Têmpera simulada</option></select></label>{method === 'tentativas' && <NumberField label="Total de tentativas" value="30" />}{method === 'tempera' && <><NumberField label="Temperatura inicial" value="1000" /><NumberField label="Temperatura final" value="0.1" /><NumberField label="Fator redutor" value="0.95" /></>}<div className="method-info"><b>{method === 'tempera' ? 'Exploração probabilística' : method === 'tentativas' ? 'Múltiplos reinícios' : 'Busca gulosa'}</b><span>{method === 'tempera' ? 'Aceita soluções piores de forma controlada.' : 'Avança pela melhor solução da vizinhança.'}</span></div></div><div className="actions"><button className="primary" onClick={execute}>Executar método <b>→</b></button><button className="secondary" onClick={analyse}>▣ Gerar análise em PDF</button></div></section><ResultArea type="local" visible={result} /></> }

function Genetic({ result, execute, analyse }: { result: boolean; execute: () => void; analyse: () => void }) { return <><SectionTitle eyebrow="ETAPA 03" title="Algoritmos genéticos" description="Ajuste os operadores evolutivos e acompanhe a evolução das soluções a cada geração." /><section className="panel control-panel"><div className="form-grid genetic-grid"><NumberField label="Tamanho da população" value="100" /><NumberField label="Número de gerações" value="250" /><NumberField label="Taxa de cruzamento" value="0.80" /><NumberField label="Taxa de mutação" value="0.05" /><NumberField label="Intervalo de geração" value="10" /><div className="method-info"><b>Seleção por torneio</b><span>Elitismo ativado para preservar a melhor solução.</span></div></div><div className="actions"><button className="primary" onClick={execute}>Executar algoritmo <b>→</b></button><button className="secondary" onClick={analyse}>▣ Gerar análise em PDF</button></div></section><ResultArea type="genetic" visible={result} /></> }
function NumberField({ label, value }: { label: string; value: string }) { return <label className="input-label">{label}<input type="number" defaultValue={value} /></label> }

function ResultArea({ type, visible }: { type: 'local' | 'genetic'; visible: boolean }) {
  if (!visible) return <section className="result-empty"><div>⌁</div><h2>Aguardando execução</h2><p>Os resultados, métricas e evolução da solução aparecerão aqui.</p></section>
  const isGenetic = type === 'genetic'
  return <section className="results"><div className="result-header"><div><span className="eyebrow">RESULTADOS DA EXECUÇÃO</span><h2>{isGenetic ? 'Evolução da população' : 'Melhor solução encontrada'}</h2></div><span className="success">● Concluído</span></div><div className="metric-cards"><article><small>FUNÇÃO OBJETIVO</small><strong>{isGenetic ? '42.800' : '43.200'}</strong><span>↓ 18,4% da solução inicial</span></article><article><small>{isGenetic ? 'MELHOR GERAÇÃO' : 'ITERACÕES'}</small><strong>{isGenetic ? '184' : '67'}</strong><span>{isGenetic ? 'de 250 gerações' : 'até a convergência'}</span></article><article><small>TEMPO DE EXECUÇÃO</small><strong>{isGenetic ? '1,84s' : '0,42s'}</strong><span>processamento local</span></article></div><div className="chart"><div className="chart-labels"><span>52k</span><span>47k</span><span>42k</span></div><svg viewBox="0 0 700 180" preserveAspectRatio="none" aria-label="Gráfico da evolução do valor objetivo"><path className="grid-line" d="M0 20H700M0 88H700M0 155H700" /><path className="area" d="M0 22 C80 30 85 100 150 107 S260 130 330 136 S450 144 520 150 S630 152 700 154 L700 180 L0 180Z" /><path className="line" d="M0 22 C80 30 85 100 150 107 S260 130 330 136 S450 144 520 150 S630 152 700 154" /></svg><div className="chart-x"><span>{isGenetic ? 'Geração 0' : 'Iteração 0'}</span><span>{isGenetic ? 'Geração 250' : 'Iteração 67'}</span></div></div></section>
}
export default App
