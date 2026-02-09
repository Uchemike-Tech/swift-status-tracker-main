export const BANK_TIMELINE_STEPS = [
  "Sender initiated transfer",
  "Waiting for payment",
  "We are processing your payment",
  "Money sent to recipient account",
];

export const CRYPTO_TIMELINE_STEPS = [
  "Transfer initiated",
  "Waiting for blockchain confirmation",
  "Transaction confirmed on network",
  "Crypto delivered to wallet",
];

export function getTimelineSteps(method: string) {
  return method === "crypto" ? CRYPTO_TIMELINE_STEPS : BANK_TIMELINE_STEPS;
}

export function getStatusStepIndex(status: string): number {
  switch (status) {
    case "pending": return 0;
    case "processing": return 2;
    case "completed": return 3;
    case "failed": return -1;
    default: return 0;
  }
}
