// ============================================================
// CONFIGURATION --- Edit these values to customize the simulator
// ============================================================

/** Month labels displayed as column headers */
export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Preset deal sizes users can add per month */
export const DEAL_SIZES = [1_500, 2_500, 5_000, 10_000] as const;

/** Monthly baseline revenue (index 0 = Jan, 11 = Dec) */
export const DEFAULT_BASELINE: number[] = Array(12).fill(0);

/** Scenario labels */
export const SCENARIO_NAMES = ['Scenario A', 'Scenario B', 'Scenario C'] as const;

/** Average deal size used for goal gap calculations */
export const AVG_DEAL_SIZE = 5_000;

// ============================================================
// TYPES
// ============================================================

export interface Account {
  month: number;
  value: number;
  id: string;
}

export interface Scenario {
  name: string;
  accounts: Account[];
  baseline: number[];
  goal: number | null;
  startingMRR: number;
}

export type TrackingStatus = 'on-track' | 'behind' | 'off-track' | 'none';

// ============================================================
// ID GENERATOR
// ============================================================

export const nextId = () => crypto.randomUUID();

// ============================================================
// HELPERS
// ============================================================

/** Coerce any value to a finite number, defaulting to 0 */
export function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Ensure baseline is always exactly 12 numbers */
export function ensureBaseline12(b: unknown): number[] {
  if (!Array.isArray(b)) return [...DEFAULT_BASELINE];
  const out = b.slice(0, 12).map(safeNum);
  while (out.length < 12) out.push(0);
  return out;
}

// ============================================================
// CALCULATION HELPERS
// ============================================================

/** Revenue from accounts added in exactly this month (new this month) */
export function calcNewRevenueThisMonth(accounts: Account[], monthIndex: number): number {
  return accounts
    .filter((a) => a.month === monthIndex)
    .reduce((sum, a) => sum + a.value, 0);
}

/** Revenue carried over from accounts started in prior months */
export function calcCarryoverRevenue(accounts: Account[], monthIndex: number): number {
  return accounts
    .filter((a) => a.month < monthIndex)
    .reduce((sum, a) => sum + a.value, 0);
}

/** Total added revenue (new + carryover) */
export function calcAddedRevenue(accounts: Account[], monthIndex: number): number {
  return accounts
    .filter((a) => a.month <= monthIndex)
    .reduce((sum, a) => sum + a.value, 0);
}

/** Monthly total = baseline + all active accounts */
export function calcMonthlyTotal(
  baseline: number[],
  accounts: Account[],
  monthIndex: number,
): number {
  return (baseline[monthIndex] || 0) + calcAddedRevenue(accounts, monthIndex);
}

/** Running total up to and including the given month */
export function calcRunningTotal(
  baseline: number[],
  accounts: Account[],
  upToMonth: number,
): number {
  let total = 0;
  for (let i = 0; i <= upToMonth; i++) {
    total += calcMonthlyTotal(baseline, accounts, i);
  }
  return total;
}

/** Annual total (sum of all 12 months) */
export function calcAnnualTotal(baseline: number[], accounts: Account[]): number {
  return calcRunningTotal(baseline, accounts, 11);
}

// ============================================================
// GOAL TRACKING
// ============================================================

/** How much more annual revenue is needed to hit the goal */
export function calcRevenueGap(baseline: number[], accounts: Account[], goal: number): number {
  return Math.max(0, goal - calcAnnualTotal(baseline, accounts));
}

/**
 * Determine tracking status based on how current trajectory compares to goal.
 * Uses a linear pace: by month M you should have (M+1)/12 of your goal.
 */
export function calcTrackingStatus(
  baseline: number[],
  accounts: Account[],
  goal: number | null,
  currentMonth: number,
): TrackingStatus {
  if (!goal || goal <= 0) return 'none';
  const running = calcRunningTotal(baseline, accounts, currentMonth);
  const expectedPace = (goal * (currentMonth + 1)) / 12;
  const ratio = running / expectedPace;
  if (ratio >= 0.95) return 'on-track';
  if (ratio >= 0.7) return 'behind';
  return 'off-track';
}

/** Find month with highest monthly total */
export function findStrongestMonth(baseline: number[], accounts: Account[]): number {
  let best = 0;
  let bestVal = -Infinity;
  for (let i = 0; i < 12; i++) {
    const val = calcMonthlyTotal(baseline, accounts, i);
    if (val > bestVal) {
      bestVal = val;
      best = i;
    }
  }
  return best;
}

/** Find month with lowest monthly total */
export function findWeakestMonth(baseline: number[], accounts: Account[]): number {
  let worst = 0;
  let worstVal = Infinity;
  for (let i = 0; i < 12; i++) {
    const val = calcMonthlyTotal(baseline, accounts, i);
    if (val < worstVal) {
      worstVal = val;
      worst = i;
    }
  }
  return worst;
}

// ============================================================
// FORMATTING
// ============================================================

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

export function formatDealSize(value: number): string {
  if (value >= 1_000) return `$${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`;
  return `$${value}`;
}
