import { CHAIN_CONFIGS } from "@circle-fin/x402-batching/client";
import { BatchFacilitatorClient, GatewayEvmScheme } from "@circle-fin/x402-batching/server";
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import { type FacilitatorClient, x402ResourceServer } from "@x402/core/server";
import type {
  Network,
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
} from "@x402/core/types";

const arcTestnet = CHAIN_CONFIGS.arcTestnet;

export const POLICY = {
  scheme: "exact",
  network: `eip155:${arcTestnet.chain.id}`,
  asset: arcTestnet.usdc,
  amount: "50000",
  provider: "circle_gateway",
  testOnly: true,
} as const;

export type SellerConfig = Readonly<{
  sellerAddress: `0x${string}`;
  publicResourceUrl: string;
}>;

function exactTerms(requirements: PaymentRequirements, sellerAddress: string): boolean {
  return requirements.scheme === POLICY.scheme
    && requirements.network === POLICY.network
    && requirements.asset.toLowerCase() === POLICY.asset.toLowerCase()
    && requirements.amount === POLICY.amount
    && requirements.payTo.toLowerCase() === sellerAddress.toLowerCase()
    && requirements.extra?.capability_id === "example-research-update"
    && requirements.extra?.capability_version === "v1";
}

export function createCircleGatewayAdapter(config: SellerConfig) {
  const facilitator = new BatchFacilitatorClient({
    url: "https://gateway-api-testnet.circle.com",
  });
  const server = new x402ResourceServer(facilitator as unknown as FacilitatorClient)
    .register(POLICY.network as Network, new GatewayEvmScheme());

  async function requirements(): Promise<PaymentRequirements[]> {
    await server.initialize();
    return server.buildPaymentRequirements({
      scheme: POLICY.scheme,
      network: POLICY.network as Network,
      payTo: config.sellerAddress,
      price: { asset: POLICY.asset, amount: POLICY.amount },
      extra: {
        capability_id: "example-research-update",
        capability_version: "v1",
      },
    });
  }

  return {
    async challenge() {
      const body = await server.createPaymentRequiredResponse(
        await requirements(),
        {
          url: config.publicResourceUrl,
          description: "Get one prepared example research update.",
          mimeType: "application/json",
        },
        "Payment required.",
      );
      return { body, header: encodePaymentRequiredHeader(body) };
    },

    async prepare(paymentSignatureHeader: string) {
      const payload: PaymentPayload = decodePaymentSignatureHeader(paymentSignatureHeader);
      if (!exactTerms(payload.accepted, config.sellerAddress)) {
        throw new Error("payment_requirements_invalid");
      }
      const accepted = server.findMatchingRequirements(await requirements(), payload);
      if (!accepted) throw new Error("payment_requirements_invalid");
      return { payload, accepted };
    },

    async settle(prepared: { payload: PaymentPayload; accepted: PaymentRequirements }) {
      const result = await server.settlePayment(prepared.payload, prepared.accepted);
      if (!result.success || !result.transaction) throw new Error("settlement_failed");
      return {
        result,
        responseHeader: encodePaymentResponseHeader(result as SettleResponse),
      };
    },
  };
}
