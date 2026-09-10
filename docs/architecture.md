# Architecture and failure order

The example separates the research product from the payment adapter.

```text
fixed request
  -> validate operation
  -> prepare and freshness-check output
  -> confirm durable storage
  -> issue Circle x402 challenge
  -> validate signed terms
  -> reserve payment identifier and request fingerprint
  -> store prepared output hash
  -> settle through Circle Gateway
  -> durably record transaction reference
  -> mark delivery settled
  -> return output and settlement receipt
```

The order is part of the contract:

- A source or freshness failure occurs before payment.
- A storage failure occurs before payment.
- A payment identifier cannot buy a different request.
- A replay returns the original settled delivery.
- A successful Gateway response is not returned as a completed delivery until its transaction reference is durable.
- An ambiguous settlement returns a reconciliation error, not an unpaid research output.

The in-memory ledger is for deterministic tests only. A deployment must use a transactional database with a unique payment identifier and compare-and-set state transitions.
