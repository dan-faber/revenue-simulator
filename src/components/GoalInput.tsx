import { Target } from 'lucide-react';

interface GoalInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const GoalInput = ({ value, onChange }: GoalInputProps) => {
  return (
    <div className="flex items-center gap-2">
      <Target className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">$</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Set annual goal..."
          className="w-full pl-6 pr-2 py-1.5 text-sm font-mono bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/50"
          value={value ? value.toLocaleString() : ''}
          onKeyDown={(e) => {
            if (['e', 'E', '-', '+', '.'].includes(e.key)) e.preventDefault();
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            if (!raw) { onChange(null); return; }
            const n = parseInt(raw, 10);
            onChange(Number.isFinite(n) ? n : null);
          }}
        />
      </div>
    </div>
  );
};

export default GoalInput;
