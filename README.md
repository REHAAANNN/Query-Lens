# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    # DBMS Project — SQL Explorer (React + TypeScript + Vite)

    A lightweight, demo-ready SQL explorer built with React + TypeScript + Vite. It connects to a Supabase (Postgres) project to run user SQL, show EXPLAIN ANALYZE metrics, present query history, provide AI-backed suggestions, and let users preview database tables.

    This README explains how to set up the project, connect it to Supabase, run it locally, and prepare it for publishing to GitHub.

    ## Features

    - Live SQL editor with AI suggestions and a suggestion dropdown below the editor
    - Execute arbitrary SQL (via Supabase RPC) and display results
    - Show EXPLAIN ANALYZE output and (planned) visualizer
    - Query history with delete/clear support (RLS-friendly)
    - Database viewer (tables + pagination/search)
    - Export query results to CSV or JSON

    ## Prerequisites

    - Node.js (LTS recommended) and npm installed
    - A Supabase project (Postgres). You'll need the project URL and an anonymous/public key for client access.
    - (Optional) A Supabase SQL editor access to run `supabase_setup.sql` included with this repo

    ## Quick start — local development

1. Clone the repo

```bash
git clone https://github.com/REHAAANNN/Query-Lens.git
cd Query-Lens
```    2. Install dependencies

    ```powershell
    npm install
    ```

    3. Create a `.env` file in the project root (or use environment variables). Add the following values from your Supabase project settings:

    ```
    VITE_SUPABASE_URL=https://xyzcompany.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJ...your_anon_key...
    ```

    Note: keys must be prefixed with `VITE_` so Vite injects them into the client. Do NOT commit `.env` to source control.

    4. (One-time) Run the database setup script in Supabase

    - Open the Supabase web console for your project
    - Go to the SQL Editor
    - Open and run the file `supabase_setup.sql` from this repository (copy & paste its contents)

    This script creates demo tables (students, courses, enrollments, etc.), some indexes, RPCs used by the app (`execute_dynamic_query`, `execute_explain_analyze`) and RLS policies used by the query history.

    5. Start the dev server

    ```powershell
    npm run dev
    ```

    Open http://localhost:5173 in your browser.

    ## How it works (high level)

    - The client communicates with Supabase directly using the `@supabase/supabase-js` client.
    - Queries are executed via RPCs that validate and return rows or EXPLAIN ANALYZE JSONB payloads. This keeps direct SQL execution controlled on the database side while still being usable from a client app.
    - Query history is stored in a `query_logs` table on the database. RLS policies are used to control deletion or per-user visibility when you enable Supabase Auth.

    ## Important files

    - `src/` — React + TypeScript app
      - `src/components/QueryEditor.tsx` — SQL input + AI suggestions
      - `src/components/QueryResults.tsx` — results table and CSV/JSON export helpers
      - `src/components/QueryHistory.tsx` — persisted history UI
      - `src/components/DatabaseViewer.tsx` — browse database tables
      - `src/services/supabaseClient.ts` — Supabase client wrapper
      - `supabase_setup.sql` — SQL schema, sample data, RPCs and RLS policies

    ## Exports & downloads

    The UI provides two export options for query results:
    - CSV — good for opening in spreadsheet apps
    - JSON — includes raw rows and a short metadata block

    If downloads don’t start in your browser, check popup/download permissions.

    ## Security notes

    - Never commit your `VITE_SUPABASE_ANON_KEY` or any other secret.
    - If you plan to share the repository publicly, rotate any keys used for testing before publishing or provide instructions for reviewers to create their own Supabase keys.
    - The included SQL adds RLS policies for demo convenience. Before production use, review and harden policies and enable Supabase Auth.

    ## Tests

    Minimal tests are planned (Vitest + React Testing Library). They are not yet included. See the TODO list in the project root for planned test coverage.

    ## Linting & build

    - Run the linter

    ```powershell
    npm run lint
    ```

    - Build for production

    ```powershell
    npm run build
    ```

    - Preview production build

    ```powershell
    npm run preview
    ```

    ## Deploying / Publishing to GitHub

    1. Make sure `.env` is in `.gitignore` and secrets are not committed.
    2. Commit and push your branch
    3. Optionally add a GitHub Action to run lint and build on push (CI configuration not included here)
    4. Deploy to Vercel/Netlify by connecting the repository and setting the environment variables in the hosting dashboard.

    ## Troubleshooting

    - If the app shows empty results or query errors, open the browser console for the network / RPC response. The Supabase RPCs return helpful JSON error messages when the SQL fails.
    - If the SQL script fails in Supabase, re-check the SQL editor logs — missing privileges or duplicate objects can cause failure. You can run DDL step-by-step.

    ## Roadmap / Next steps

    Planned improvements (short list):
    - Add unit & integration tests (Vitest)
    - Replace textarea with a proper SQL editor (Monaco/CodeMirror)
    - EXPLAIN visualizer (tree/graph)
    - Virtualization for extremely large result sets
    - Per-user history via Supabase Auth and stricter RLS
    - CI/CD workflow for builds and deployments

    ## Contributing

    Contributions are welcome. Open an issue first if the change is large. Keep PRs focused and include a short description of the change and how to test it.

    ## License

    MIT

    ---

    If you want, I can:
    - Add a minimal GitHub Actions workflow (lint + build) before you push
    - Add an example `.env.example` file and a short CONTRIBUTING.md
    - Add a short demo GIF or screenshots to the README

    Tell me which of these you'd like me to add next and I'll implement it.

