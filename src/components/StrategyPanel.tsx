import {
  MONTHS,
  AVG_DEAL_SIZE,
  calcAnnualTotal,
  calcMonthlyTotal,
  calcRevenueGap,
  calcTrackingStatus,
  findStrongestMonth,
  findWeakestMonth,
  formatCurrency,
  formatDealSize,
  type Account,
  type TrackingStatus,
} from '@/config/simulator';
import { TrendingUp, TrendingDown, Target, BarChart3, Users, Crosshair } from 'lucide-react';

interface StrategyPanelProps {
  baseline: number[];
  accounts: Account[];
  goal: number | null;
  startingMRR: number;
  currentMonth: number;
}

function statusLabel(status: TrackingStatus): string {
  if (status === 'on-track') return 'On Track';
  if (status === 'behind') return 'Slightly Behind';
  if (status === 'off-track') return 'Off Track';
  return '';
}

function statusDotClass(status: TrackingStatus): string {
  if (status === 'on-track') return 'status-dot-on-track';
  if (status === 'behind') return 'status-dot-behind';
  if (status === 'off-track') return 'status-dot-off-track';
  return 'bg-muted';
}

function statusTextClass(status: TrackingStatus): string {
  if (status === 'on-track') return 'status-on-track';
  if (status === 'behind') return 'status-behind';
  if (status === 'off-track') return 'status-off-track';
  return 'text-muted-foreground';
}

function statusBorderClass(status: TrackingStatus): string {
  if (status === 'on-track') return 'status-border-on-track';
  if (status === 'behind') return 'status-border-behind';
  if (status === 'off-track') return 'status-border-off-track';
  return 'border-border';
}

function statusBgClass(status: TrackingStatus): string {
  if (status === 'on-track') return 'status-bg-on-track';
  if (status === 'behind') return 'status-bg-behind';
  if (status === 'off-track') return 'status-bg-off-track';
  return '';
}

const StrategyPanel = ({ baseline, accounts, goal, startingMRR, currentMonth }: StrategyPanelProps) => {
  const effectiveBaseline = baseline.map((b) => b + startingMRR);

  const annualTotal = calcAnnualTotal(effectiveBaseline, accounts);
  const totalBaseline = effectiveBaseline.reduce((a, b) => a + b, 0);
  const totalAdded = annualTotal - totalBaseline;
  const accountCount = accounts.length;

  const strongestIdx = findStrongestMonth(effectiveBaseline, accounts);
  const weakestIdx = findWeakestMonth(effectiveBaseline, accounts);
  const strongestVal = calcMonthlyTotal(effectiveBaseline, accounts, strongestIdx);
  const weakestVal = calcMonthlyTotal(effectiveBaseline, accounts, weakestIdx);

  // Goal calculations — only run when goal is valid
  const hasGoal = goal !== null && goal > 0;
  const gap = hasGoal ? calcRevenueGap(effectiveBaseline, accounts, goal) : 0;
  const overallStatus = hasGoal
    ? calcTrackingStatus(effectiveBaseline, accounts, goal, currentMonth)
    : ('none' as TrackingStatus);

  // Deals needed to close gap (using average deal size)
  const remainingMonths = Math.max(1, 12 - currentMonth);
  const dealsNeeded = hasGoal ? Math.ceil(gap / AVG_DEAL_SIZE) : 0;
  const dealsPerMonth = hasGoal ? Math.ceil(dealsNeeded / remainingMonths) : 0;

  return (
    <div className="space-y-3">
      {/* Overall Status Badge */}
      {hasGoal && (
        <div className={`rounded-lg border p-3 ${statusBorderClass(overallStatus)} ${statusBgClass(overallStatus)}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${statusDotClass(overallStatus)}`} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${statusTextClass(overallStatus)}`}>
              {statusLabel(overallStatus)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {gap > 0
              ? `${formatCurrency(gap)} remaining to goal`
              : 'Goal achieved! 🎯'}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="space-y-2">
        <StatRow
          icon={<BarChart3 className="w-3.5 h-3.5" />}
          label="New Revenue"
          value={totalAdded > 0 ? `+${formatCurrency(totalAdded)}` : '$0'}
          valueClass={totalAdded > 0 ? 'revenue-positive' : ''}
        />
        <StatRow
          icon={<Users className="w-3.5 h-3.5" />}
          label="Accounts Added"
          value={String(accountCount)}
        />
        <StatRow
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="Strongest Month"
          value={`${MONTHS[strongestIdx]} · ${formatCurrency(strongestVal)}`}
          valueClass="revenue-positive"
        />
        <StatRow
          icon={<TrendingDown className="w-3.5 h-3.5" />}
          label="Weakest Month"
          value={`${MONTHS[weakestIdx]} · ${formatCurrency(weakestVal)}`}
          valueClass={accountCount > 0 ? 'text-muted-foreground' : ''}
        />
      </div>

      {/* Goal Gap Analysis */}
      {hasGoal && gap > 0 && (
        <div className="border-t border-border pt-3 space-y-2">
          <div className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Crosshair className="w-3 h-3" />
            To Hit Goal
          </div>
          <StatRow
            icon={<Target className="w-3.5 h-3.5" />}
            label="Revenue Gap"
            value={formatCurrency(gap)}
            valueClass="status-off-track"
          />
          <StatRow
            icon={<Users className="w-3.5 h-3.5" />}
            label={`Deals Needed (avg ${formatDealSize(AVG_DEAL_SIZE)})`}
            value={String(dealsNeeded)}
          />
          <StatRow
            icon={<BarChart3 className="w-3.5 h-3.5" />}
            label="Deals/Month Remaining"
            value={`${dealsPerMonth}/mo`}
            valueClass="font-bold"
          />
        </div>
      )}
    </div>
  );
};

function StatRow({
  icon,
  label,
  value,
  valueClass = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <span className={`text-sm font-mono font-semibold whitespace-nowrap ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

export default StrategyPanel;
