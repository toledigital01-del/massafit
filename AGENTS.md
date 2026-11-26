<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application rules
- Shopping quantities use tested, browser-safe conversion rules; preserve exact prepared-plan grams separately from estimated purchase weights and round packages up only after aggregating the selected period.
- Keep nutrition formulas in a browser-safe pure module with numeric tests so calculations remain auditable.
- Private data reads and writes use authenticated server functions and owner-scoped RLS; public routes show a read-only preview and invite sign-in rather than redirecting.
- A single root auth provider owns identity transitions and clears user query caches on sign-out to avoid cross-account data leakage.
- Home-screen installation uses manifest-only PWA support, without offline caching, to preserve preview and OAuth behavior.
- Workout plan, exercise cues and double-progression rules live in a pure module with tests; only performed sets are stored per user.
