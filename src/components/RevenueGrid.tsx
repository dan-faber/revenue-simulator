import {
  MONTHS,
  ONE_OFF_SIZES,
  calcNewRevenueThisMonth,
  calcCarryoverRevenue,
  calcAddedRevenue,
  calcOneOffRevenue,
  calcMonthlyTotal,
  calcRunningTotal,
  calcAnnualTotal,
  calcRevenueGap,
  calcTrackingStatus,
  formatCurrency,
  type Account,
  type TrackingStatus,
} from '@/config/simulator';
import DealChips from './DealChips';
import { Target } from 'lucide-react';

interface RevenueGridProps {
  baseline: number[];
  accounts: Account[];
  oneOffs: Account[];
  goal: number | null;
  startingMRR: number;
  onAddAccount: (monthIndex: number, value: number) => void;
  onRemoveAccount: (id: string) => void;
  onAddOneOff: (monthIndex: number, value: number) => void;
  onRemoveOneOff: (id: string) => void;
  onSetBaseline: (monthIndex: number, value: number) => void;
  onSetStartingMRR: (value: number) => void;
}

/** Get CSS class suffix for a tracking status */
function statusClass(status: TrackingStatus): string {
  if (status === 'on-track') return 'on-track';
  if (status === 'behind') return 'behind';
  if (status === 'off-track') return 'off-track';
  return '';
}

const RevenueGrid = ({
  baseline, accounts, oneOffs, goal, startingMRR,
  onAddAccount, onRemoveAccount, onAddOneOff, onRemoveOneOff,
  onSetBaseline, onSetStartingMRR,
}: RevenueGridProps) => {
  // effectiveBaseline folds startingMRR into each month so existing calc functions just work
  const effectiveBaseline = baseline.map((b) => b + startingMRR);

  const monthlyNew = MONTHS.map((_, i) => calcNewRevenueThisMonth(accounts, i));
  const monthlyCarry = MONTHS.map((_, i) => calcCarryoverRevenue(accounts, i));
  const monthlyAdded = MONTHS.map((_, i) => calcAddedRevenue(accounts, i));
  const monthlyOneOff = MONTHS.map((_, i) => calcOneOffRevenue(oneOffs, i));
  const monthlyTotals = MONTHS.map((_, i) => calcMonthlyTotal(effectiveBaseline, accounts, i, oneOffs));
  const runningTotals = MONTHS.map((_, i) => calcRunningTotal(effectiveBaseline, accounts, i, oneOffs));
  const annualTotal = calcAnnualTotal(effectiveBaseline, accounts, oneOffs);
  const totalBaseline = effectiveBaseline.reduce((a, b) => a + b, 0);
  const totalAdded = monthlyAdded[11] || 0;
  const totalNew = monthlyNew.reduce((a, b) => a + b, 0);
  const totalCarry = monthlyCarry.reduce((a, b) => a + b, 0);
  const totalOneOff = monthlyOneOff.reduce((a, b) => a + b, 0);

  // Goal tracking per month
  const statuses: TrackingStatus[] = MONTHS.map((_, i) =>
    calcTrackingStatus(effectiveBaseline, accounts, goal, i, oneOffs),
  );

  // Goal gap
  const gap = goal ? calcRevenueGap(effectiveBaseline, accounts, goal) : 0;

  // Goal pace line: what running total should be at each month
  const goalPace = goal
    ? MONTHS.map((_, i) => (goal * (i + 1)) / 12)
    : null;

  return (
    <div className="overflow-x-auto border border-border rounded-lg bg-card">
      <table className="w-full border-collapse min-w-[1000px]">
        <thead>
          <tr>
            <th className="grid-header-cell text-left w-40 sticky left-0 z-10" style={{ background: 'hsl(var(--grid-header))' }}>
              &nbsp;
            </th>
            {MONTHS.map((m, i) => {
              const st = statuses[i];
              return (
                <th key={m} className={`grid-header-cell text-center min-w-[85px] ${st !== 'none' ? `status-bg-${statusClass(st)}` : ''}`}>
                  {m}
                </th>
              );
            })}
            <th className="grid-header-cell text-center min-w-[100px] font-bold">
              Year Total
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Starting Recurring */}
          <tr>
            <td className="grid-cell text-xs font-medium sticky left-0 bg-card z-10 text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Starting Recurring</span>
                <div className="relative ml-auto">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-20 pl-4 pr-1 py-0.5 text-xs font-mono bg-background border border-border rounded text-right focus:outline-none focus:ring-1 focus:ring-ring"
                    value={startingMRR ? startingMRR.toLocaleString() : ''}
                    placeholder="0"
                    onKeyDown={(e) => {
                      if (['e', 'E', '-', '+', '.'].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      const n = parseInt(raw, 10);
                      onSetStartingMRR(Number.isFinite(n) ? n : 0);
                    }}
                  />
                </div>
              </div>
            </td>
            {MONTHS.map((_, i) => (
              <td key={i} className="grid-cell grid-number text-center text-muted-foreground">
                {startingMRR > 0 ? formatCurrency(startingMRR) : '---'}
              </td>
            ))}
            <td className="grid-cell grid-number text-center text-muted-foreground">
              {startingMRR > 0 ? formatCurrency(startingMRR * 12) : '---'}
            </td>
          </tr>

          {/* Baseline (editable) */}
          <tr>
            <td className="grid-cell text-xs font-medium sticky left-0 bg-card z-10 text-muted-foreground">
              Baseline
            </td>
            {baseline.map((val, i) => (
              <td key={i} className="grid-cell p-1">
                <div className="relative">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full pl-4 pr-1 py-0.5 text-xs font-mono bg-background border border-border rounded text-right focus:outline-none focus:ring-1 focus:ring-ring text-muted-foreground"
                    value={val ? val.toLocaleString() : ''}
                    placeholder="0"
                    onKeyDown={(e) => {
                      if (['e', 'E', '-', '+', '.'].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      const n = parseInt(raw, 10);
                      onSetBaseline(i, Number.isFinite(n) ? n : 0);
                    }}
                  />
                </div>
              </td>
            ))}
            <td className="grid-cell grid-number text-center text-muted-foreground">
              {formatCurrency(baseline.reduce((a, b) => a + b, 0))}
            </td>
          </tr>

          {/* Add Recurring Deals */}
          <tr>
            <td className="grid-cell text-xs font-medium sticky left-0 bg-card z-10">
              Recurring Deals
            </td>
            {MONTHS.map((_, i) => (
              <td key={i} className="grid-cell align-top p-1">
                <DealChips
                  monthIndex={i}
                  accounts={accounts}
                  onAdd={onAddAccount}
                  onRemove={onRemoveAccount}
                />
              </td>
            ))}
            <td className="grid-cell" />
          </tr>

          {/* New Recurring This Month */}
          <tr>
            <td className="grid-cell text-xs font-medium sticky left-0 bg-card z-10 text-muted-foreground">
              New This Month
            </td>
            {monthlyNew.map((val, i) => (
              <td key={i} className={`grid-cell grid-number text-center text-xs ${val > 0 ? 'revenue-positive' : 'text-muted-foreground'}`}>
                {val > 0 ? `+${formatCurrency(val)}` : '---'}
              </td>
            ))}
            <td className={`grid-cell grid-number text-center text-xs ${totalNew > 0 ? 'revenue-positive' : ''}`}>
              {totalNew > 0 ? `+${formatCurrency(totalNew)}` : '---'}
            </td>
          </tr>

          {/* Carryover */}
          <tr>
            <td className="grid-cell text-xs font-medium sticky left-0 bg-card z-10 text-muted-foreground">
              Carryover
            </td>
            {monthlyCarry.map((val, i) => (
              <td key={i} className="grid-cell grid-number text-center text-xs text-muted-foreground">
                {val > 0 ? formatCurrency(val) : '---'}
              </td>
            ))}
            <td className="grid-cell grid-number text-center text-xs text-muted-foreground">
              {totalCarry > 0 ? formatCurrency(totalCarry) : '---'}
            </td>
          </tr>

          {/* Added Recurring Revenue */}
          <tr className="bg-accent/30">
            <td className="grid-cell text-xs font-semibold sticky left-0 z-10" style={{ background: 'hsl(var(--accent) / 0.3)' }}>
              Added Recurring
            </td>
            {monthlyAdded.map((val, i) => (
              <td key={i} className={`grid-cell grid-number text-center ${val > 0 ? 'revenue-positive font-semibold' : ''}`}>
                {val > 0 ? `+${formatCurrency(val)}` : '---'}
              </td>
            ))}
            <td className={`grid-cell grid-number text-center font-bold ${totalAdded > 0 ? 'revenue-positive' : ''}`}>
              {totalAdded > 0 ? `+${formatCurrency(totalAdded)}` : '---'}
            </td>
          </tr>

          {/* One-Off Deals */}
          <tr>
            <td className="grid-cell text-xs font-medium sticky left-0 bg-card z-10">
              One-Off Deals
            </td>
            {MONTHS.map((_, i) => (
              <td key={i} className="grid-cell align-top p-1">
                <DealChips
                  monthIndex={i}
                  accounts={oneOffs}
                  sizes={ONE_OFF_SIZES}
                  onAdd={onAddOneOff}
                  onRemove={onRemoveOneOff}
                />
              </td>
            ))}
            <td className={`grid-cell grid-number text-center font-semibold ${totalOneOff > 0 ? 'revenue-positive' : ''}`}>
              {totalOneOff > 0 ? `+${formatCurrency(totalOneOff)}` : '---'}
            </td>
          </tr>

          {/* Monthly Total */}
          <tr className="bg-secondary/50">
            <td className="grid-cell text-xs font-bold sticky left-0 z-10" style={{ background: 'hsl(var(--secondary) / 0.5)' }}>
              Monthly Total
            </td>
            {monthlyTotals.map((val, i) => (
              <td key={i} className="grid-cell grid-number text-center font-semibold">
                {formatCurrency(val)}
              </td>
            ))}
            <td className="grid-cell grid-number text-center font-bold">
              {formatCurrency(annualTotal)}
            </td>
          </tr>

          {/* Running Total */}
          <tr>
            <td className="grid-cell text-xs font-medium sticky left-0 bg-card z-10">
              Running Total
            </td>
            {runningTotals.map((val, i) => {
              const st = statuses[i];
              return (
                <td key={i} className={`grid-cell grid-number text-center ${st !== 'none' ? `status-${statusClass(st)} font-semibold` : ''}`}>
                  {formatCurrency(val)}
                </td>
              );
            })}
            <td className="grid-cell grid-number text-center font-bold">
              {formatCurrency(annualTotal)}
            </td>
          </tr>

          {/* Goal Pace (if goal set) */}
          {goalPace && (
            <tr>
              <td className="grid-cell text-xs font-medium sticky left-0 bg-card z-10 text-muted-foreground border-b-0">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Goal Pace
                </span>
              </td>
              {goalPace.map((val, i) => (
                <td key={i} className="grid-cell grid-number text-center text-xs text-muted-foreground border-b-0">
                  {formatCurrency(Math.round(val))}
                </td>
              ))}
              <td className="grid-cell grid-number text-center text-xs font-semibold text-muted-foreground border-b-0">
                {formatCurrency(goal ?? 0)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RevenueGrid;
