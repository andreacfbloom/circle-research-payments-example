import { createHash, randomUUID } from "node:crypto";

export const REQUEST = Object.freeze({
  capability_id: "example-research-update",
  capability_version: "v1",
});

export const PAYMENT_POLICY = Object.freeze({
  provider: "circle_gateway",
  scheme: "exact",
  network: "eip155:5042002",
  asset: "0x3600000000000000000000000000000000000000",
  amount_atomic: "50000",
  currency: "USDC",
  test_only: true,
});

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function validateRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort();
  return keys.length === 2
    && keys[0] === "capability_id"
    && keys[1] === "capability_version"
    && value.capability_id === REQUEST.capability_id
    && value.capability_version === REQUEST.capability_version;
}

export function requestFingerprint(value = REQUEST) {
  if (!validateRequest(value)) throw new Error("invalid_request");
  return createHash("sha256")
    .update(JSON.stringify(stable({ method: "POST", path: "/v1/research/update", request: value, payment: PAYMENT_POLICY })))
    .digest("hex");
}

export function canIssueChallenge(readiness) {
  return Boolean(
    readiness?.sellerConfigured
    && readiness?.storageReady
    && readiness?.packReady
    && readiness?.packFresh,
  );
}

export class DemoDeliveryLedger {
  #records = new Map();

  reserve(paymentIdentifier, fingerprint) {
    const existing = this.#records.get(paymentIdentifier);
    if (existing) {
      if (existing.request_fingerprint !== fingerprint) return { kind: "fingerprint_conflict", record: structuredClone(existing) };
      if (existing.status === "settled") return { kind: "settled", record: structuredClone(existing) };
      return { kind: "in_progress", record: structuredClone(existing) };
    }
    const record = {
      receipt_reference: randomUUID(),
      payment_identifier: paymentIdentifier,
      request_fingerprint: fingerprint,
      status: "reserved",
      output_hash: null,
      output: null,
      transaction_reference: null,
    };
    this.#records.set(paymentIdentifier, record);
    return { kind: "owner", record: structuredClone(record) };
  }

  prepare(paymentIdentifier, outputHash, output) {
    const record = this.#require(paymentIdentifier, "reserved");
    record.status = "settling";
    record.output_hash = outputHash;
    record.output = structuredClone(output);
    return structuredClone(record);
  }

  observeSettlement(paymentIdentifier, transactionReference) {
    const record = this.#require(paymentIdentifier, "settling");
    if (!record.output_hash || !record.output || !transactionReference) throw new Error("settlement_invariant_failed");
    record.transaction_reference = transactionReference;
    return structuredClone(record);
  }

  markSettled(paymentIdentifier) {
    const record = this.#require(paymentIdentifier, "settling");
    if (!record.transaction_reference) throw new Error("transaction_reference_required");
    record.status = "settled";
    return structuredClone(record);
  }

  get(paymentIdentifier) {
    const record = this.#records.get(paymentIdentifier);
    return record ? structuredClone(record) : null;
  }

  #require(paymentIdentifier, status) {
    const record = this.#records.get(paymentIdentifier);
    if (!record || record.status !== status) throw new Error("delivery_state_invalid");
    return record;
  }
}
