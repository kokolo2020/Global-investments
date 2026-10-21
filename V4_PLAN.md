# V4 server automation rollout
Status: **not activated**. UI is updated; automatic order execution must not be claimed active.

## Strategy specifications
- Universe: 70 eligible non-stablecoin markets by market cap; per-symbol liquidity and volume checks required.
- 1h EMA20 > EMA50 for long or < for short; 4h EMA50 > EMA200 for long or < for short.
- Long RSI14 between 50–70; short RSI14 between 30–50; completed candles only.
- 3x isolated virtual leverage; default $250 margin/order, max 10 positions; maximum 80% committed margin.
- Hard 2% underlying price stop, 4% target, trailing stop after 2% favorable move; check positions with fresh mark quotes and fail closed on missing quotes.
- 5% UTC-day equity drawdown cap blocks new orders. Existing protective exits still permitted.
- No averaging down; one position per symbol; no automatic resets or topping up funds.
- Record indicative fills with quote timestamp, fee/slippage model, signal time, idempotency key, stop reason, and audit trail.

## Code
`engine/trend.js` includes deterministic signal, levels, risk check, and accounting helpers (no scheduler, no trade execution).

## Required before enabling automated trading
1. Create protected per-user server ledger and account state in Supabase with unique idempotency keys and transactional locking.
2. Add reliable historical 1h and 4h closed candles, liquidity filter, ADX and fees/slippage. Current strategy library is intentionally an incomplete signal prototype (ADX/volume not active yet).
3. Schedule server worker with retries, durable execution logs, and independently enforced daily risk limits.
4. Add user opt-in and suspend/resume controls; test liquidation and close behavior, stale data, network outages and restart recovery.
5. Publish independently audited strategy leaderboards (weekly/monthly/all-time) from immutable daily equity snapshots, not browser-submitted values.
6. Test at least 30 days out-of-sample or appropriately representative historical periods, and paper-trade soak before rollout.

Manual V3 positions remain untouched. Existing Supabase users, nicknames, likes and global leaderboard are preserved. Chat removed from the website, but stored historical chat rows remain untouched.
