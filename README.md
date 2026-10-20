# Global Investment Challenge — V1.0

An interactive, dark-navy-and-electric-blue worldwide cooperative investment challenge dashboard inspired by the approved design image.

## Included
- Responsive desktop, tablet and mobile layout.
- Virtual portfolio balance, total return, open positions, and demo statistics.
- Illustrative candlestick and performance charts, portfolio allocation doughnut, and market movers.
- Working buy/sell **paper trades**, positions, close position, and trade history.
- Weekly, Monthly and All Time leaderboard tabs.
- Example AI/Manual/Hybrid strategy tabs and emoji-only leaderboard reactions.
- Guest browser persistence via localStorage.
- Download a JSON backup and restore it to another browser/device.

## Run
Open `index.html` in a browser. No dependencies or build command are required.

## Deploy to Netlify
1. Choose **Add new project > Import an existing project**.
2. Select GitHub repository `kokolo2020/Global-investments` and branch `main`.
3. The **build command is empty**; the **publish directory is `.`**.
4. Deploy. Every future GitHub push updates the deployment if continuous deployment is enabled.

## What is real vs demonstration
**This is a design prototype and local paper-trading sandbox. It does not place real trades.**
- The initial stock/crypto prices, index ticker, charts, community member count, AI confidence, win-ranking examples, and leaderboards are **fixed illustrations**, not live data or predictive signals.
- Trading transactions are computed and logged based on those demo prices in the local browser. They are not exchange fills.
- Guest positions/trade history and emoji selections are stored in **that browser** only. Export a backup to move it; the Guest ID is not a server-side recovery key.
- Public leaderboards and online counts aren't shared/verified until an authenticated backend and centralized ledger are introduced.
- AI Pick / Hybrid are UI concepts only, not autonomous strategy execution.

## Next engineering milestones
1. Supabase Auth: persistent guest-to-email account upgrades and safe cross-device recovery.
2. Supabase/Postgres: centralized portfolios, append-only trade audit ledger, user reactions, real active-user presence, competition snapshots.
3. Live market feeds and deterministic simulated order execution with spreads, fees, slippage and timestamped quotes.
4. Weekly/monthly/all-time competition rules (period baselines, return, max drawdown, risk-adjusted score, anti-cheat checks).
5. Real strategy backtesting, out-of-sample evaluation and fair global competitions.

No investment returns are promised. This project is for simulation and research, not financial advice.
