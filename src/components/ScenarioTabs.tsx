import { SCENARIO_NAMES } from '@/config/simulator';

interface ScenarioTabsProps {
  activeIndex: number;
  onChange: (index: number) => void;
}

const ScenarioTabs = ({ activeIndex, onChange }: ScenarioTabsProps) => (
  <div className="flex gap-1.5">
    {SCENARIO_NAMES.map((name, i) => (
      <button
        key={name}
        onClick={() => onChange(i)}
        className={i === activeIndex ? 'scenario-tab-active' : 'scenario-tab-inactive'}
      >
        {name}
      </button>
    ))}
  </div>
);

export default ScenarioTabs;
