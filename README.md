# AdaptiveMed 🩺🧠
### Plataforma Educacional de Repetição Espaçada Adaptativa & Análise de Desempenho para Residência Médica

O **AdaptiveMed** é uma aplicação web full-stack de alto rendimento desenvolvida especificamente para médicos e estudantes em preparação para os mais concorridos concursos de Residência Médica (USP, ENARE, UNICAMP, SUS-SP, entre outros).

A plataforma utiliza um motor matemático de repetição espaçada adaptativa baseado no desempenho real do aluno (taxa de acertos em questões), recalculando dinamicamente os intervalos de revisão ótima para vencer a Curva do Esquecimento de Ebbinghaus e garantir retenção de longo prazo até o dia da prova.

---

## ⚡ Arquitetura & Custo Zero de Infraestrutura
A plataforma foi projetada para operar com **custo zero** de hospedagem e banco de dados:
- **Frontend & Serverless Edge**: [Vercel](https://vercel.com/) (Hospedagem global gratuita com Next.js 15 App Router).
- **Backend Relacional & Auth**: [Supabase](https://supabase.com/) (PostgreSQL com Row Level Security e autenticação JWT gratuita).
- **PWA (Progressive Web App)**: Instalável diretamente na tela inicial de qualquer smartphone (iOS e Android) sem passar pelas lojas de aplicativos.

---

## 🛠️ Stack Tecnológica
- **Framework:** Next.js 15 (App Router, Server Actions e React Server Components)
- **Linguagem:** TypeScript (tipagem estrita em todo o projeto)
- **Estilização:** Tailwind CSS (Dark Mode Slate `#0B0F17` por padrão + Light Mode)
- **Componentes:** Componentes acessíveis do shadcn/ui
- **Ícones:** Lucide React
- **Gráficos:** Recharts (Radar, Barras comparativas e Linha temporal de evolução)
- **Produtividade:** Sincronização iCalendar (`.ics`) e exportação para planilhas (`.csv`)

---

## 🗄️ Modelagem do Banco de Dados & RLS (Supabase)
O script de migração completo encontra-se em [`supabase/migrations/20260924_initial_schema.sql`](./supabase/migrations/20260924_initial_schema.sql) com **Row Level Security (RLS)** ativo em 100% das tabelas:

1. `profiles`: Perfis de usuários com nome e especialidade alvo.
2. `study_topics`: Registro de assuntos estudados nas 5 Grandes Áreas Médicas:
   - Clínica Médica
   - Cirurgia Geral
   - Pediatria
   - Ginecologia e Obstetrícia
   - Medicina Preventiva
3. `topic_reviews`: Os 8 ciclos progressivos de revisão espaçada (R1 a R8) com agendamento adaptativo e dados de execução.
4. `mock_exams`: Simulados gerais com KPIs de média, maior e menor nota e distribuição por faixas de corte.
5. `institution_exams`: Provas na íntegra por banca/instituição com acompanhamento ano a ano.

---

## 🧮 Motor de Repetição Espaçada Adaptativa
Implementado na função pura `calculateNextReviewInterval(percentage, reviewNumber)` em [`src/lib/spaced-repetition.ts`](./src/lib/spaced-repetition.ts):

### 1ª Revisão (R1) - Intervalo após o contato inicial:
- Acerto `< 60%`: somar **3 dias**
- Acerto entre `60% e 65%`: somar **10 dias**
- Acerto entre `66% e 70%`: somar **13 dias**
- Acerto entre `71% e 80%`: somar **20 dias**
- Acerto `> 80%`: somar **23 dias**

### Revisões Subsequentes (R2 a R8):
- Acerto `< 60%`: somar **7 dias**
- Acerto entre `60% e 65%`: somar **13 dias**
- Acerto entre `66% e 70%`: somar **18 dias**
- Acerto entre `71% e 80%`: somar **25 dias**
- Acerto `> 80%`: somar **30 dias**

### Status Dinâmico de Revisão:
- **CONCLUÍDO:** Revisão já realizada com taxa de acerto registrada.
- **ATRASADO:** Revisão com data programada menor que hoje (exibe contador de dias em atraso).
- **REVISAR HOJE:** Revisão programada para o dia atual.
- **PROGRAMADO:** Revisão futura com contagem regressiva de dias.

---

## 🚀 Como Executar Localmente

### 1. Clonar o repositório e instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente (Opcional para modo conectado)
Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```
Preencha suas chaves do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```
> **Nota:** Caso não configure as chaves do Supabase, o AdaptiveMed opera automaticamente no **Modo Demonstração** de alta fidelidade com persistência local e dados médicos realistas pré-carregados!

### 3. Rodar as migrações no Supabase (se conectado)
Acesse o painel do seu projeto no Supabase -> **SQL Editor** -> Cole e execute o arquivo `supabase/migrations/20260924_initial_schema.sql`.

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📱 Instalação como Aplicativo (PWA)
1. No smartphone (Safari no iOS ou Chrome no Android), acesse a URL do sistema.
2. Toque no botão de compartilhamento / opções do navegador.
3. Selecione **"Adicionar à Tela de Início"**.
4. O AdaptiveMed funcionará como um aplicativo nativo em tela cheia, com ícone próprio e navegação inferior otimizada.
