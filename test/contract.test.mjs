import assert from "node:assert/strict";
import test from "node:test";

import {
  DemoDeliveryLedger,
  REQUEST,
  canIssueChallenge,
  requestFingerprint,
  validateRequest,
} from "../src/contract.mjs";

test("accepts only the fixed research operation", () => {
  assert.equal(validateRequest(REQUEST), true);
  assert.equal(validateRequest({ ...REQUEST, ticker: "EXAMPLE" }), false);
  assert.equal(validateRequest({ capability_id: "other", capability_version: "v1" }), false);
});

test("issues a challenge only after all pre-payment gates pass", () => {
  assert.equal(canIssueChallenge({ sellerConfigured: true, storageReady: true, packReady: true, packFresh: true }), true);
  assert.equal(canIssueChallenge({ sellerConfigured: true, storageReady: false, packReady: true, packFresh: true }), false);
  assert.equal(canIssueChallenge({ sellerConfigured: true, storageReady: true, packReady: true, packFresh: false }), false);
});

test("returns the same settled delivery for a replayed payment identifier", () => {
  const ledger = new DemoDeliveryLedger();
  const fingerprint = requestFingerprint();
  assert.equal(ledger.reserve("payment_1", fingerprint).kind, "owner");
  ledger.prepare("payment_1", "a".repeat(64), { result: "synthetic" });
  ledger.observeSettlement("payment_1", "0xsynthetic");
  const settled = ledger.markSettled("payment_1");
  const replay = ledger.reserve("payment_1", fingerprint);
  assert.equal(replay.kind, "settled");
  assert.deepEqual(replay.record, settled);
});

test("rejects payment identifier reuse for a different fingerprint", () => {
  const ledger = new DemoDeliveryLedger();
  ledger.reserve("payment_2", requestFingerprint());
  assert.equal(ledger.reserve("payment_2", "b".repeat(64)).kind, "fingerprint_conflict");
});

test("does not mark delivery settled before the transaction reference is durable", () => {
  const ledger = new DemoDeliveryLedger();
  ledger.reserve("payment_3", requestFingerprint());
  ledger.prepare("payment_3", "c".repeat(64), { result: "synthetic" });
  assert.throws(() => ledger.markSettled("payment_3"), /transaction_reference_required/);
  assert.equal(ledger.get("payment_3").status, "settling");
});
