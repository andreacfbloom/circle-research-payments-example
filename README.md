# Circle Research Payments Example

A public Arc Testnet reference for selling one fixed, source-linked research update through Circle Gateway and x402.

This repository is the reviewable companion to EquityLayer's Circle grant application. It contains a sanitized payment adapter, a provider-neutral delivery state machine, an OpenAPI contract, synthetic examples, and tests. It does not contain EquityLayer's private product code, paid research, user data, wallet keys, or production credentials.

## Status

| Layer | Status |
| --- | --- |
| Fixed research capability and price | Implemented |
| Circle Gateway Arc Testnet adapter | Implemented and type-checked |
| Replay and settlement-integrity tests | Implemented |
| OpenAPI and synthetic receipt | Implemented |
| Live HTTPS seller endpoint | Pending deployment evidence |
| Real Arc Testnet buyer-to-seller settlement | Pending wallet evidence |
| Production or mainnet launch | Out of scope |

Do not describe this repository as a live payment service until the two pending testnet evidence items are complete.

## Fixed contract

- Capability: `example-research-update:v1`
- Method: `POST`
- Price: `0.05 USDC`
- Network: Arc Testnet (`eip155:5042002`)
- Asset: Arc Testnet USDC
- Payment provider: Circle Gateway
- Input: one fixed capability request; no ticker, prompt, URL, or trade instruction

The service must prepare a fresh output and reserve durable storage before it issues a payment challenge. It must not deliver the output until Circle reports a successful settlement and the transaction reference is durably recorded.

## Run the checks

Use Node.js 22 or later and pnpm 10 or later.

```sh
pnpm install
pnpm test
pnpm typecheck
```

The tests cover strict input, pre-payment readiness, payment-identifier replay, fingerprint conflict, and the rule that a transaction reference must exist before delivery becomes settled.

## Repository map

- `src/circle-gateway.example.ts`: Circle Gateway x402 adapter.
- `src/contract.mjs`: provider-neutral contract and demo ledger.
- `test/contract.test.mjs`: payment-integrity tests.
- `openapi/openapi.json`: public HTTP contract.
- `examples/`: synthetic 402 and settled responses.
- `docs/architecture.md`: boundary and failure-order design.
- `docs/evidence-checklist.md`: remaining Arc Testnet proof.

## Safety boundary

All addresses and transaction references in `examples/` are synthetic. Never commit an email one-time password, wallet seed, private key, API key, raw payment signature, database URL, or unredacted user identifier.

This software is an integration example, not investment advice or a custody product. See the [Circle Gateway documentation](https://developers.circle.com/gateway) before operating a real testnet or production service.
