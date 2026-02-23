// ============================================================
// CONFIGURATION --- Edit these values to customize the simulator
// ============================================================

/** Month labels displayed as column headers */
export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Preset recurring deal sizes */
export const DEAL_SIZES = [1_500, 2_500, 3_500, 5_000, 6_000, 7_000] as const;

/** Preset one-off deal sizes */
export const ONE_OFF_SIZES = [1_500, 2_500, 3_500, 5_000, 6_000, 7_000] as const;

/** Monthly baseline revenue (index 0 = Jan, 11 = Dec) */
export const DEFAULT_BASELINE: number[] = Array(12).fill(0);

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
  oneOffs: Account[];
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

/** Revenue from one-off deals in exactly this month (no carryover) */
export function calcOneOffRevenue(oneOffs: Account[], monthIndex: number): number {
  return oneOffs
    .filter((a) => a.month === monthIndex)
    .reduce((sum, a) => sum + a.value, 0);
}

/** Monthly total = baseline + recurring added + one-off */
export function calcMonthlyTotal(
  baseline: number[],
  accounts: Account[],
  monthIndex: number,
  oneOffs: Account[] = [],
): number {
  return (baseline[monthIndex] || 0) + calcAddedRevenue(accounts, monthIndex) + calcOneOffRevenue(oneOffs, monthIndex);
}

/** Running total up to and including the given month */
export function calcRunningTotal(
  baseline: number[],
  accounts: Account[],
  upToMonth: number,
  oneOffs: Account[] = [],
): number {
  let total = 0;
  for (let i = 0; i <= upToMonth; i++) {
    total += calcMonthlyTotal(baseline, accounts, i, oneOffs);
  }
  return total;
}

/** Annual total (sum of all 12 months) */
export function calcAnnualTotal(baseline: number[], accounts: Account[], oneOffs: Account[] = []): number {
  return calcRunningTotal(baseline, accounts, 11, oneOffs);
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
  oneOffs: Account[] = [],
): TrackingStatus {
  if (!goal || goal <= 0) return 'none';
  const running = calcRunningTotal(baseline, accounts, currentMonth, oneOffs);
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
