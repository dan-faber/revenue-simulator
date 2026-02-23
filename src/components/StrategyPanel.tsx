import {
  calcAnnualTotal,
  calcTrackingStatus,
  formatCurrency,
  type Account,
  type TrackingStatus,
} from '@/config/simulator';
import { BarChart3, Users } from 'lucide-react';

interface StrategyPanelProps {
  baseline: number[];
  accounts: Account[];
  oneOffs: Account[];
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

const StrategyPanel = ({ baseline, accounts, oneOffs, goal, startingMRR, currentMonth }: StrategyPanelProps) => {
  const effectiveBaseline = baseline.map((b) => b + startingMRR);

  const annualTotal = calcAnnualTotal(effectiveBaseline, accounts, oneOffs);
  const totalBaseline = effectiveBaseline.reduce((a, b) => a + b, 0);
  const totalAdded = annualTotal - totalBaseline;
  const recurringCount = accounts.length;
  const oneOffCount = oneOffs.length;

  // Goal calculations — only run when goal is valid
  const hasGoal = goal !== null && goal > 0;
  const overallStatus = hasGoal
    ? calcTrackingStatus(effectiveBaseline, accounts, goal, currentMonth, oneOffs)
    : ('none' as TrackingStatus);
  const remaining = hasGoal ? Math.max(0, goal - annualTotal) : 0;

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
            {remaining > 0
              ? `${formatCurrency(remaining)} remaining to goal`
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
          label="Recurring Deals"
          value={String(recurringCount)}
        />
        <StatRow
          icon={<Users className="w-3.5 h-3.5" />}
          label="One-Off Deals"
          value={String(oneOffCount)}
        />
      </div>
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
