/**
 * Shared green/red convention for spread and premium/discount numbers:
 * green for positive (premium), red for negative (discount). Reusable
 * anywhere a signed spread percentage is rendered (How It Works, the
 * dashboard preview, Problem/Solution, etc).
 */
export function spreadColorClass(value: number): string {
  return value >= 0 ? "text-green-400" : "text-red-500";
}
