import { useState, useCallback, useEffect } from 'react';
import {
  SCENARIO_NAMES,
  DEFAULT_BASELINE,
  nextId,
  calcAnnualTotal,
  formatCurrency,
  safeNum,
  ensureBaseline12,
  type Scenario,
} from '@/config/simulator';
import ScenarioTabs from '@/components/ScenarioTabs';
import RevenueGrid from '@/components/RevenueGrid';
import StrategyPanel from '@/components/StrategyPanel';
import GoalInput from '@/components/GoalInput';
import { TrendingUp, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'revenue-simulator-scenarios';
const STORAGE_VERSION = 1;

const createScenarios = (): Scenario[] =>
  SCENARIO_NAMES.map((name) => ({
    name,
    accounts: [],
    baseline: [...DEFAULT_BASELINE],
    goal: null,
    startingMRR: 0,
  }));

function sanitizeScenario(s: any, fallbackName: string): Scenario {
  return {
    name: typeof s?.name === 'string' ? s.name : fallbackName,
    accounts: Array.isArray(s?.accounts)
      ? s.accounts.filter((a: any) => typeof a?.id === 'string' && Number.isFinite(a?.value) && Number.isFinite(a?.month))
      : [],
    baseline: ensureBaseline12(s?.baseline),
    goal: s?.goal !== null && Number.isFinite(Number(s?.goal)) ? Number(s.goal) : null,
    startingMRR: safeNum(s?.startingMRR),
  };
}

function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Version check — wipe on schema mismatch
      if (parsed?.version !== STORAGE_VERSION || !Array.isArray(parsed?.scenarios)) {
        localStorage.removeItem(STORAGE_KEY);
        return createScenarios();
      }
      return SCENARIO_NAMES.map((name, i) =>
        sanitizeScenario(parsed.scenarios[i], name),
      );
    }
  } catch { /* corrupted data — fall through */ }
  return createScenarios();
}

function saveScenarios(scenarios: Scenario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, scenarios }));
}

const SYSTEM_MONTH = new Date().getMonth();

const Index = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>(loadScenarios);
  const [activeScenario, setActiveScenario] = useState(0);

  // Autosave on every change
  useEffect(() => {
    saveScenarios(scenarios);
  }, [scenarios]);

  const current = scenarios[activeScenario] ?? scenarios[0];

  const updateCurrentScenario = useCallback(
    (updater: (s: Scenario) => Scenario) => {
      setScenarios((prev) =>
        prev.map((s, i) => (i === activeScenario ? updater(s) : s)),
      );
    },
    [activeScenario],
  );

  const handleAddAccount = useCallback(
    (monthIndex: number, value: number) => {
      updateCurrentScenario((s) => ({
        ...s,
        accounts: [...s.accounts, { month: monthIndex, value, id: nextId() }],
      }));
    },
    [updateCurrentScenario],
  );

  const handleRemoveAccount = useCallback(
    (id: string) => {
      updateCurrentScenario((s) => ({
        ...s,
        accounts: s.accounts.filter((a) => a.id !== id),
      }));
    },
    [updateCurrentScenario],
  );

  const handleSetGoal = useCallback(
    (goal: number | null) => {
      updateCurrentScenario((s) => ({ ...s, goal }));
    },
    [updateCurrentScenario],
  );

  const handleReset = useCallback(() => {
    updateCurrentScenario((s) => ({ ...s, accounts: [], goal: null, startingMRR: 0, baseline: [...DEFAULT_BASELINE] }));
  }, [updateCurrentScenario]);

  const currentMonth = SYSTEM_MONTH;

  const handleSetBaseline = useCallback(
    (monthIndex: number, value: number) => {
      updateCurrentScenario((s) => {
        const newBaseline = [...s.baseline];
        newBaseline[monthIndex] = value;
        return { ...s, baseline: newBaseline };
      });
    },
    [updateCurrentScenario],
  );

  const handleSetStartingMRR = useCallback(
    (value: number) => {
      updateCurrentScenario((s) => ({ ...s, startingMRR: value }));
    },
    [updateCurrentScenario],
  );

  const effectiveBaseline = current.baseline.map((b) => b + current.startingMRR);
  const annualTotal = calcAnnualTotal(effectiveBaseline, current.accounts);
  const accountCount = current.accounts.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-tight">
                Revenue Simulator
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Close deals → see impact → steer your year
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Deals</div>
              <div className="text-lg font-mono font-semibold text-foreground">
                {accountCount}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Annual Revenue</div>
              <div className={`text-lg font-mono font-bold ${annualTotal > 0 ? 'revenue-positive' : 'text-foreground'}`}>
                {formatCurrency(annualTotal)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout: grid + side panel */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        <div className="flex gap-5">
          {/* Left: main grid area */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Controls bar */}
            <div className="flex items-center justify-between">
              <ScenarioTabs activeIndex={activeScenario} onChange={setActiveScenario} />
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Revenue grid */}
            <RevenueGrid
              baseline={current.baseline}
              accounts={current.accounts}
              goal={current.goal}
              startingMRR={current.startingMRR}
              onAddAccount={handleAddAccount}
              onRemoveAccount={handleRemoveAccount}
              onSetBaseline={handleSetBaseline}
              onSetStartingMRR={handleSetStartingMRR}
            />
          </div>

          {/* Right: strategy panel */}
          <aside className="w-64 shrink-0 space-y-3 hidden lg:block">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Goal
            </div>
            <GoalInput value={current.goal} onChange={handleSetGoal} />
            <div className="border-t border-border pt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Strategy Summary
              </div>
              <StrategyPanel
                baseline={current.baseline}
                accounts={current.accounts}
                goal={current.goal}
                startingMRR={current.startingMRR}
                currentMonth={currentMonth}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Index;
