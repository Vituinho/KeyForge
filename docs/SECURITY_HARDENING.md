# KeyForge security boundaries

The backend migration preserves the validated attempt-based typing, campaign gates, combat/reward balance and local Academy algorithms. The trusted persistence boundary is now the authenticated Node backend and PostgreSQL transactions. Deployment and legacy import procedures are in [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md).

| Operation | Authority and enforcement |
| --- | --- |
| XP, levels, rank and gameplay statistics | Existing pure reward calculators applied to validated server-issued campaign/practice evidence or a finished authoritative participant match |
| Campaign completion | Existing sequential stage/world gates plus replayed enemy/text/input challenge; no completion write endpoint |
| Currency, owned cosmetics and crates | Server-calculated activity grants, owned-skin equipment, server-random crate outcome and transactionally deducted crate/currency |
| Multiplayer words, damage and victory | Session-derived participant, server seed/text, ordered attempts, cumulative server pacing, existing combo/energy/damage formulas and persistent match state |
| Duplicate/replayed claims | Unique account/source and match/account/event ledgers; changed payload bindings rejected; PostgreSQL serializable transaction retries |
| Profile preferences | Exact allowlist for username/accessibility settings; user derived from session; case-insensitive unique username |
| Legacy/imported progress | Full protected archive; operator-only reviewed export import; unverified local/old records cannot become competitive progression |
| Guest progression/Academy telemetry | Local personal data, preserved; no competitive authority |

HTTP requires live Better Auth database sessions. First-party HttpOnly cookies are used through the Next proxy. Production requires a separate backend proxy secret, an exact HTTPS frontend origin, Secure cookies and private backend database credentials. HTTP mutation origins and extra protected payload fields are rejected. Auth rate limiting uses PostgreSQL; supplementary limits cover HTTP/WebSocket payloads and messages. Errors omit SQL/internal details. The runtime role is a non-owner, non-superuser without schema creation or migration-ledger access.

WebSocket authenticates with a short one-use ticket bound to a current session. Room subscription requires persisted membership; clients cannot broadcast trusted damage, inventory or results. Reconnection obtains a fresh snapshot and ticket. Server heartbeats establish the 15-second disconnect grace, and session revocation is checked on messages and periodic heartbeats. Run one backend replica until distributed presence/fanout are implemented.

Local validation uses actual Better Auth requests and PostgreSQL migrations/transactions, HTTP with the compiled backend and Next production build, and authenticated two-account WebSocket sessions. The previous 176 SQL-role/RPC checks have been adapted to applicable HTTP authorization, transaction, account-isolation, replay, inventory, practice/campaign and multiplayer boundaries; retired database API/RPC checks are superseded by having no browser database interface. The current assertion count is recorded in the migration report; it is not a claim that the old SQL suite runs unchanged.

No deployed service has been verified. Staging access controls, TLS/cookies, production roles, networking, backup/restore, account export provenance and container deployment remain explicit gates. No push, deploy or external data modification was performed.
