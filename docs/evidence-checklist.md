# Arc Testnet evidence checklist

Complete this checklist before the repository or application says the integration is live.

- [ ] Public HTTPS endpoint returns the documented OpenAPI contract.
- [ ] An unpaid fixed request returns HTTP 402 with the expected Arc Testnet terms.
- [ ] Circle CLI inspection identifies the fixed method, chain, asset, and amount.
- [ ] A buyer estimate reports no more than 0.05 USDC.
- [ ] One approved buyer payment settles through Circle Gateway.
- [ ] The response contains a deterministic output hash and a receipt reference.
- [ ] The database contains the same redacted transaction and receipt references.
- [ ] Replaying the same signed payment returns the same delivery without a second charge.
- [ ] Concurrent duplicates do not create two delivery owners.
- [ ] A stale or unavailable source blocks the challenge before payment.
- [ ] A simulated storage failure after settlement returns a reconciliation error.
- [ ] Evidence excludes wallet seeds, private keys, one-time passwords, raw signatures, and personal data.

Store the final evidence outside this public repository until every secret and user identifier is removed.
