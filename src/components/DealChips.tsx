import { Plus, Minus } from 'lucide-react';
import { DEAL_SIZES, formatDealSize, type Account } from '@/config/simulator';

interface DealChipsProps {
  monthIndex: number;
  accounts: Account[];
  sizes?: readonly number[];
  onAdd: (monthIndex: number, value: number) => void;
  onRemove: (id: string) => void;
}

const DealChips = ({ monthIndex, accounts, sizes = DEAL_SIZES, onAdd, onRemove }: DealChipsProps) => {
  const monthAccounts = accounts.filter((a) => a.month === monthIndex);
  const countBySize = sizes.reduce(
    (acc, size) => {
      acc[size] = monthAccounts.filter((a) => a.value === size).length;
      return acc;
    },
    {} as Record<number, number>,
  );

  return (
    <div className="flex flex-col gap-0.5">
      {sizes.map((size) => {
        const count = countBySize[size] || 0;
        const lastAccount = monthAccounts.filter((a) => a.value === size).pop();
        return (
          <div key={size} className="flex items-center gap-0.5">
            <button
              onClick={() => onAdd(monthIndex, size)}
              className={`deal-chip flex-1 justify-center ${count > 0 ? 'deal-chip-active' : ''}`}
              title={`Add ${formatDealSize(size)} deal`}
            >
              <Plus className="w-2.5 h-2.5 shrink-0 opacity-40" />
              <span className="truncate">
                {formatDealSize(size)}
                {count > 0 && (
                  <span className="ml-0.5 opacity-80">×{count}</span>
                )}
              </span>
            </button>
            {count > 0 && lastAccount && (
              <button
                onClick={() => onRemove(lastAccount.id)}
                className="p-0.5 rounded hover:bg-destructive/10 transition-colors shrink-0"
                title="Remove one"
              >
                <Minus className="w-3 h-3 text-destructive" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DealChips;
