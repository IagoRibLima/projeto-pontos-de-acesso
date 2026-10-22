# Documentação técnica — Distribuição de roteadores

## 1. Objetivo do sistema

O sistema encontra boas posições para cinco roteadores em uma área quadrada de 8 × 8 células. Cada posição é representada por um par `(linha, coluna)`, com índices de 0 a 7.

O projeto possui três partes:

1. `backend/funcoes.py` contém o modelo matemático e os algoritmos de busca.
2. `backend/api_sistema.py` expõe esses algoritmos por uma API HTTP e valida os dados recebidos.
3. `frontend/src` contém a interface React usada para configurar cenários, executar algoritmos e visualizar os resultados.

O frontend não calcula a solução. Ele envia entradas à API e apresenta a resposta. A API também não reimplementa os algoritmos: ela importa e chama as funções de `backend/funcoes.py`.

## 2. Arquitetura e fluxo geral

```text
Usuário
  │
  ▼
Interface React
  │  GET /api/configuracao
  │  POST /api/cenarios
  │  POST /api/busca-local
  ▼
API FastAPI
  │
  ▼
funcoes.py
  ├── cria a matriz de cobertura
  ├── avalia a distribuição
  ├── executa subida de encosta
  └── executa têmpera simulada
```

O fluxo normal é:

1. Ao abrir a página, o frontend consulta `GET /api/configuracao`.
2. O usuário gera um cenário fixo ou aleatório em **Configurações**.
3. A API devolve as cinco posições iniciais, a matriz de sinal e suas métricas.
4. O usuário escolhe um método em **Busca local**.
5. O frontend envia as posições do cenário carregado para `POST /api/busca-local`.
6. A API executa o algoritmo de `funcoes.py` e devolve as soluções inicial e final.
7. O frontend mostra as duas matrizes, a pontuação, a cobertura e o tempo de execução.

O sistema não utiliza banco de dados. Cenário e resultado existem apenas no estado da página. Recarregar o navegador apaga esses dados.

## 3. Regras do problema

As constantes abaixo estão definidas em `backend/funcoes.py`:

| Constante | Valor | Significado |
|---|---:|---|
| `TAMANHO` | 8 | Número de linhas e colunas da área |
| `QUANTIDADE_ROTEADORES` | 5 | Total de roteadores da solução |
| `ALCANCE` | 5 | Intensidade máxima do sinal na célula do roteador |
| `PONTOS_PRIORITARIOS` | `(1,1)`, `(2,6)`, `(5,2)`, `(6,6)` | Células que recebem bônus quando cobertas |
| `PESO_PRIORITARIO` | 10 | Bônus por ponto prioritário com sinal positivo |

### 3.1 Quadrantes

A área é dividida ao meio:

```text
colunas 0–3       colunas 4–7
┌───────────────┬───────────────┐
│ Q1            │ Q2            │ linhas 0–3
├───────────────┼───────────────┤
│ Q3            │ Q4            │ linhas 4–7
└───────────────┴───────────────┘
```

Toda solução válida precisa ter pelo menos um roteador em cada quadrante. Como existem cinco roteadores, um dos quadrantes terá pelo menos dois.

### 3.2 Distância e sinal

O alcance usa distância Manhattan. Para uma célula `(i, j)` e um roteador em `(x, y)`:

```text
distância = |i - x| + |j - y|
sinal = máximo(0, ALCANCE - distância)
```

Exemplo com `ALCANCE = 5`:

- distância 0 → sinal 5;
- distância 1 → sinal 4;
- distância 4 → sinal 1;
- distância 5 ou maior → sinal 0.

Quando mais de um roteador alcança a mesma célula, a matriz guarda o maior sinal. Os sinais não são somados.

### 3.3 Função de avaliação

A pontuação é calculada assim:

```text
pontuação = soma dos sinais
            - quantidade de células com sinal zero
            + bônus dos pontos prioritários cobertos
```

Cada ponto prioritário com sinal maior que zero adiciona 10 pontos. Esse cálculo favorece sinal forte, penaliza áreas de sombra e dá importância adicional às quatro células prioritárias.

## 4. Backend: `funcoes.py`

Esse arquivo contém a lógica original do problema e não é alterado pela API ou pelo frontend.

### 4.1 `area(x, y)`

Cria uma matriz com `y` linhas e `x` colunas, preenchida com zeros. No cenário atual, é chamada como `area(8, 8)`.

### 4.2 Classe `roteador`

Representa um roteador e guarda apenas o atributo `alcance`. A API cria o objeto com `roteador(ALCANCE)`.

### 4.3 `identificar_quadrante(x, y)`

Compara a linha e a coluna com `TAMANHO // 2`, que vale 4, e retorna `Q1`, `Q2`, `Q3` ou `Q4`.

Observação: apesar dos nomes `x` e `y`, o primeiro valor é usado como linha e o segundo como coluna em todo o sistema.

### 4.4 `quadrantes_validos(posicoes)`

Identifica o quadrante de cada posição, cria um conjunto sem repetições e aceita a solução quando os quatro quadrantes aparecem nesse conjunto.

### 4.5 `avaliar(matriz)`

Percorre todas as células, acumula os sinais positivos e conta as células iguais a zero. Depois aplica a penalidade das sombras e os bônus prioritários. Retorna um número inteiro.

### 4.6 `preencher(matriz, eixo_x, eixo_y, roteador_obj)`

Calcula a contribuição de um roteador para todas as células. Uma célula só é atualizada quando o novo valor é maior que o valor já armazenado. Isso implementa a regra de manter o sinal mais forte.

### 4.7 `criar_matriz_cobertura(posicoes, roteador_obj)`

Cria uma matriz vazia e chama `preencher` uma vez para cada roteador. O resultado representa a cobertura combinada da distribuição.

### 4.8 `gerar_posicoes_iniciais()`

Sorteia uma posição em cada quadrante e depois sorteia a quinta posição entre todas as células ainda livres. Assim, a solução inicial já possui cinco posições distintas e todos os quadrantes ocupados.

### 4.9 `sucessores(atual_x, atual_y, matriz, roteador_obj)`

Possui dois modos por compatibilidade com uma versão anterior:

- se `atual_x` e `atual_y` forem inteiros, gera movimentos ortogonais para um único roteador;
- se `atual_x` for uma lista de posições, gera vizinhos para os cinco roteadores.

No modo atual, a função tenta mover cada roteador para cada célula livre da matriz. Descarta posições repetidas e soluções que deixariam algum quadrante vazio. Para cada candidato válido, calcula matriz e pontuação.

### 4.10 `subida_encosta(roteador_obj, posicoes_iniciais=None)`

O algoritmo começa pelas posições informadas ou gera posições aleatórias. Em cada ciclo:

1. gera todos os sucessores válidos;
2. seleciona o sucessor de maior pontuação;
3. aceita o sucessor somente se ele melhorar a pontuação atual;
4. encerra quando não existe melhora.

Esse comportamento é guloso: sempre escolhe a melhor opção imediata. Por isso, pode terminar em um máximo local. O retorno é `(posicoes, matriz, valor)`.

### 4.11 `gerar_sucessor_tempera(atual, roteador_obj)`

Embaralha a ordem dos roteadores e das células livres. Retorna o primeiro movimento que preserva os quatro quadrantes. Também devolve a matriz e a avaliação da nova distribuição.

### 4.12 `tempera_simulada(...)`

Executa a têmpera simulada com quatro parâmetros:

| Parâmetro | Padrão | Função |
|---|---:|---|
| `temperatura_inicial` | 100 | Controla a aceitação inicial de pioras |
| `temperatura_final` | 0,1 | Limite que encerra o algoritmo |
| `taxa_resfriamento` | 0,95 | Multiplicador aplicado após cada ciclo |
| `iteracoes_por_temperatura` | 100 | Tentativas realizadas em cada temperatura |

Uma melhora sempre é aceita. Uma piora de diferença `diferenca < 0` é aceita com probabilidade:

```text
exp(diferenca / temperatura)
```

Temperaturas maiores aumentam a chance de aceitar pioras e escapar de máximos locais. O algoritmo mantém uma cópia independente da melhor solução vista, mesmo que a solução corrente piore posteriormente. O retorno contém a melhor solução encontrada.

### 4.13 Funções de teste e relatório

- `imprimir_resultado` escreve posições, quadrantes, matriz e métricas no terminal.
- `teste_fixo` usa as posições `(1,1)`, `(1,6)`, `(6,1)`, `(6,6)` e `(3,4)`.
- `teste_aleatorio` define uma semente e gera uma distribuição válida.
- o bloco `if __name__ == "__main__"` executa os dois cenários quando `funcoes.py` é iniciado diretamente. Esse bloco não roda quando o arquivo é importado pela API.

## 5. Backend: API FastAPI

O arquivo `backend/api_sistema.py` adapta as funções Python para HTTP.

### 5.1 Dependências

- **FastAPI** cria as rotas e a documentação OpenAPI.
- **Pydantic** valida corpos de requisição e formata respostas.
- **Uvicorn** executa a aplicação ASGI.

As versões aceitas estão em `backend/requirements.txt`. `backend/requirements-dev.txt` adiciona `httpx`, necessário aos testes.

### 5.2 Tipos de coordenada

`Coordenada` aceita apenas inteiros estritos entre 0 e 7. Valores booleanos, decimais, negativos ou maiores que 7 são rejeitados. `Posicao` é uma tupla com duas coordenadas.

### 5.3 Modelos de entrada

Todos herdam de `Entrada`, que rejeita campos desconhecidos e números infinitos ou `NaN`.

#### `CenarioCriar`

- `modo`: `fixa` ou `aleatoria`;
- `semente`: inteiro opcional de 0 a `2³² - 1`.

#### `ParametrosTempera`

- temperatura inicial maior que zero e no máximo 10.000;
- temperatura final de pelo menos 0,001;
- temperatura final menor que a inicial;
- taxa de resfriamento maior que zero e menor que um;
- de 1 a 1.000 iterações por temperatura.

A validação calcula quantas etapas de resfriamento serão necessárias. O produto entre etapas e iterações não pode superar 50.000 tentativas. Esse limite evita requisições excessivamente custosas.

#### `BuscaCriar`

- método `encosta` ou `tempera`;
- exatamente cinco posições iniciais;
- posições dentro da matriz e sem duplicatas;
- todos os quadrantes representados;
- semente opcional;
- parâmetros opcionais para a têmpera.

Parâmetros de têmpera são rejeitados quando o método escolhido é subida de encosta.

### 5.4 Modelos de resposta

`Solucao` contém:

- posições dos roteadores;
- matriz de sinal;
- pontuação;
- quantidade e percentual de células cobertas;
- quantidade de células sem cobertura;
- contagem de roteadores por quadrante;
- sinal de cada ponto prioritário.

`CenarioResposta` adiciona modo e semente. `BuscaResposta` contém solução inicial, solução final, melhoria de pontuação, método, parâmetros e tempo de execução.

### 5.5 Isolamento do gerador aleatório

`funcoes.py` usa o gerador global do módulo `random`. Duas requisições simultâneas poderiam alterar a sequência uma da outra. O contexto `execucao_isolada` resolve isso com três passos:

1. adquire um `Lock`, permitindo uma execução por vez em cada processo;
2. salva o estado atual do gerador e aplica a semente da requisição;
3. restaura o estado anterior no bloco `finally`, inclusive quando ocorre erro.

Isso torna uma execução com semente reproduzível e evita que uma chamada mude o estado aleatório da seguinte. Em uma implantação com vários processos, cada processo mantém seu próprio lock e seu próprio gerador.

### 5.6 `descrever_solucao`

Converte a tupla retornada por `funcoes.py` em um objeto `Solucao`. Calcula as métricas adicionais usadas pelo frontend sem alterar matriz, posições ou pontuação do algoritmo.

### 5.7 Endpoints

#### `GET /api/configuracao`

Retorna as constantes do problema e os métodos disponíveis. O frontend usa essa resposta para apresentar os valores atuais e habilitar somente métodos suportados.

#### `POST /api/cenarios`

Exemplo:

```json
{
  "modo": "aleatoria",
  "semente": 42
}
```

No modo fixo chama `teste_fixo`. No modo aleatório chama `teste_aleatorio`. A resposta contém a solução descrita e a semente, quando aplicável.

#### `POST /api/busca-local`

Exemplo:

```json
{
  "metodo": "tempera",
  "posicoes_iniciais": [[1, 1], [1, 6], [6, 1], [6, 6], [3, 4]],
  "semente": 42,
  "parametros_tempera": {
    "temperatura_inicial": 100,
    "temperatura_final": 0.1,
    "taxa_resfriamento": 0.95,
    "iteracoes_por_temperatura": 100
  }
}
```

A rota primeiro reconstrói e descreve a solução inicial. Depois executa o método solicitado, mede o tempo com `perf_counter` e calcula `melhoria = pontuação final - pontuação inicial`.

Entradas inválidas recebem HTTP 422 com os detalhes produzidos pelo Pydantic.

## 6. Frontend

O frontend utiliza React 19, TypeScript e Vite. A refatoração separa apresentação, estado, acesso HTTP e tipos.

```text
frontend/src/
├── App.tsx
├── api.ts
├── App.css
├── index.css
├── main.tsx
├── components/
│   ├── CoverageGrid.tsx
│   ├── FeedbackMessages.tsx
│   ├── Layout.tsx
│   ├── NumberField.tsx
│   ├── SearchResult.tsx
│   └── SectionTitle.tsx
├── hooks/
│   └── useRouterSystem.ts
├── pages/
│   ├── LocalSearchPage.tsx
│   ├── OverviewPage.tsx
│   └── SettingsPage.tsx
├── types/
│   └── navigation.ts
└── utils/
    └── errors.ts
```

### 6.1 `main.tsx`

É o ponto de entrada. Procura o elemento `#root` do `index.html`, cria a raiz React e renderiza `App` dentro de `StrictMode`.

### 6.2 `App.tsx`

É o coordenador da interface. Mantém apenas a seção atual da navegação, obtém o estado do hook `useRouterSystem` e escolhe qual página renderizar. Ele não possui formulários, regras HTTP ou marcação da matriz.

### 6.3 `api.ts`

Define os tipos compartilhados das respostas e centraliza as chamadas HTTP.

- `requisicao<T>` envolve `fetch`, trata falhas de conexão e transforma erros HTTP em mensagens legíveis;
- `post` cria a configuração comum das requisições JSON;
- `obterConfiguracao` chama `GET /api/configuracao`;
- `criarCenario` chama `POST /api/cenarios`;
- `executarBusca` chama `POST /api/busca-local`.

Todas as URLs começam com `/api`. Durante o desenvolvimento, o proxy do Vite encaminha essas chamadas para `http://127.0.0.1:8000`.

### 6.4 `useRouterSystem.ts`

Centraliza o estado do domínio:

- configuração recebida da API;
- cenário atual;
- resultado da busca;
- indicador de carregamento;
- avisos, erros de operação e erros de conexão.

O `useEffect` inicial carrega a configuração. Um `AbortController` cancela a requisição se o componente for desmontado. `generateScenario` e `runSearch` controlam o ciclo de carregamento, limpam mensagens antigas, chamam a API e atualizam o estado apropriado. `reconnect` dispara uma nova consulta da configuração.

### 6.5 Componentes

#### `Layout.tsx`

Monta a barra lateral, a navegação, o breadcrumb e a área principal. O canto superior esquerdo mostra somente o símbolo. O lado direito do cabeçalho foi removido, portanto não há avatar nem indicador de cenário nessa região.

#### `FeedbackMessages.tsx`

Exibe separadamente erro de conexão, erro de uma operação e mensagem de sucesso. Também oferece ações para reconectar ou fechar a mensagem.

#### `SectionTitle.tsx`

Padroniza o rótulo da etapa, o título e a descrição das páginas.

#### `NumberField.tsx`

Padroniza campos numéricos e recebe limites, passo, valor e função de alteração.

#### `CoverageGrid.tsx`

Renderiza a matriz retornada pela API. Para cada célula:

- escolhe uma cor conforme existe ou não sinal;
- identifica se há um roteador naquela posição;
- identifica se é um ponto prioritário;
- marca visualmente a divisão entre quadrantes;
- gera um texto descritivo no atributo `title`.

Depois da tabela, lista posições, quantidade por quadrante, sinal dos pontos prioritários e métricas da solução.

#### `SearchResult.tsx`

Mostra o estado vazio ou o resultado da execução. Quando há resultado, apresenta cartões de pontuação, cobertura e tempo, seguidos pelas matrizes inicial e final.

### 6.6 Páginas

#### `OverviewPage.tsx`

Apresenta o objetivo do sistema e conduz o usuário para a configuração.

#### `SettingsPage.tsx`

Mantém localmente o modo e a semente do formulário. Ao enviar, chama `onGenerate`. A matriz mostrada nessa página é sempre a resposta real da API.

#### `LocalSearchPage.tsx`

Mantém os campos do método de busca. Os parâmetros da têmpera aparecem apenas quando esse método é selecionado. Qualquer alteração de método ou parâmetro limpa o resultado anterior, evitando exibir um resultado como se pertencesse à configuração nova.

O botão de execução fica desabilitado sem cenário ou quando o método não aparece na configuração devolvida pela API. A lista apresenta somente subida de encosta e têmpera simulada, que são os métodos realmente implementados no backend.

### 6.7 Navegação e utilitários

`types/navigation.ts` concentra o tipo das seções e os itens do menu. `utils/errors.ts` transforma valores capturados em mensagens seguras para a interface.

### 6.8 Estilos

`index.css` define fonte, fundo e regras globais. `App.css` contém:

- variáveis de cor;
- layout da barra lateral e cabeçalho;
- cartões e formulários;
- matriz de cobertura e legenda;
- estados de sucesso, erro e carregamento;
- regras responsivas para telas de até 900 px e 600 px;

## 7. Execução local

Na raiz do projeto:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
python -m uvicorn backend.api_sistema:app --reload --host 127.0.0.1 --port 8000
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O Vite normalmente abre em `http://localhost:5173`. A documentação automática da API fica em `http://127.0.0.1:8000/docs`.

Para produção, o servidor web precisa encaminhar `/api` para a aplicação FastAPI. O diretório gerado por `npm run build` contém somente os arquivos estáticos do frontend.

## 8. Testes e verificações

### Backend

```bash
python -m unittest backend.test_api_sistema -v
```

`backend/test_api_sistema.py` verifica:

- configuração e cenário fixo;
- cálculo de matriz e métricas;
- repetição por semente;
- preservação do estado aleatório;
- chamadas concorrentes;
- subida de encosta e têmpera;
- rejeição de posições, métodos e parâmetros inválidos.

### Frontend

```bash
cd frontend
npm run build
npm run lint
```

O build executa o compilador TypeScript e gera os arquivos de produção. O lint verifica padrões de qualidade, hooks React e problemas comuns no código.

## 9. Limitações atuais

- A área é fixa em 8 × 8 porque `gerar_posicoes_iniciais` usa explicitamente os limites 0–3 e 4–7.
- O número de roteadores é fixo em cinco.
- Não há persistência nem histórico de execuções.
- A API executa os algoritmos de forma síncrona.
- O lock serializa os algoritmos dentro de cada processo da API.
- `funcoes.py` imprime relatórios no terminal durante algumas chamadas.
- A subida de encosta pode parar em um máximo local.
- A têmpera depende dos parâmetros e de aleatoriedade; uma semente permite repetir a execução.
- Não há subida de encosta com reinícios nem algoritmo genético implementado ou exibido na interface.
- As funções retornam apenas a solução final; por isso o frontend não mostra um gráfico real das iterações.

## 10. Caminhos seguros para evolução

Para permitir tamanho variável, seria necessário trocar os limites fixos de `gerar_posicoes_iniciais` por limites calculados a partir de `TAMANHO` e revisar os pontos prioritários. Para mostrar evolução por iteração, os algoritmos precisariam retornar ou emitir um histórico. Persistência exigiria um banco de dados e identificadores de execução. Um algoritmo genético precisaria ser implementado no backend antes de ser incluído na interface.

Qualquer mudança nessas regras deve começar em `funcoes.py`, seguida pela atualização dos modelos da API, dos testes e dos componentes que exibem os dados.
