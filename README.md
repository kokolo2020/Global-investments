# Global Investment Challenge — V3.3 multiplayer preparation

Public site: https://global-investments2027.netlify.app/

## Existing paper-trading game
- Each visitor starts with $2,500 virtual funds; chooses up to 10 coins from 70 non-stablecoin crypto assets.
- Long/Short, 3×/4× leverage, local positions, P/L and closes.
- First-order nickname prompt, local weekly/monthly/all-time personal stats, export/import local browser backups.
- Demo ledger is **browser-local**, not independently audited.

## Worldwide V3.3 community (requires setup)
The dashboard now includes a public top-10 leaderboard with **one like per registered user per player**, and a chat panel, all backed by a private Netlify function + Supabase database.

### Activate it
1. Create a Supabase project.
2. Paste and execute `supabase/community.sql` in **SQL Editor**.
3. In the Netlify site, go to **Project configuration → Environment variables**, adding:
   - `SUPABASE_URL`: the Supabase project API URL, e.g. `https://PROJECT.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: the service-role secret from your Supabase project's API settings.
4. Keep the service-role key **private**, only inside Netlify environment variables (never in HTML, repository or chat). Trigger a **new Netlify deploy** after configuring.
5. On visiting the site, submit the first virtual trade, choose a nickname, and use the global chat or wait for synchronization. A worldwide profile is created on first connection to the community API. Other visitors use the same public site URL from their own devices.
6. Test from two browsers. Chat refreshes every 15 seconds; results sync approximately once per minute.

### Important limits
- The global rankings display **submitted paper equity**, NOT verified or tamper-proof performance. Treat the leaderboard as a beta/social preview, not a prize competition. Client values can be manipulated; build server-side order execution and audit logs before offering rewards or relying on ranks.
- Weekly/monthly/all-time tabs currently reflect the **local** guest's personal snapshot history. The worldwide ranking is currently cumulative submitted equity only; period-specific global leaderboards require server-side equity snapshots.
- Nicknames, messages and likes are stored centrally. Local trading data is not automatically copied to the server.
- The global chat is public: 160 characters, basic banned-word/link filter, one message per 12 seconds. **These are not sufficient for a public launch.** Add reporting, moderator deletion, rate limiting at an edge gateway, stronger content moderation and anti-spam controls before broadly sharing.
- No Google/email authentication yet. Identity uses a random token kept in browser storage and its hash in the database. Clearing browser storage means loss of the community identity; export of paper portfolio does not export that identity.
- Community server returns an unavailable response when credentials have not been supplied, and the dashboard correctly shows an unconfigured notice.
- No real-money trading or investment advice.

## File map
- `index.html`: responsive game + chat, community API client.
- `netlify/functions/top50.js`: CoinGecko market ranking feed.
- `netlify/functions/community.js`: server-only community API.
- `supabase/community.sql`: database schema.
