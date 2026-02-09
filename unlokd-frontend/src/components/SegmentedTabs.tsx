type TabOption = {
  id: 'login' | 'signup';
  label: string;
};

type SegmentedTabsProps = {
  options: TabOption[];
  value: TabOption['id'];
  onChange: (value: TabOption['id']) => void;
};

export function SegmentedTabs({ options, value, onChange }: SegmentedTabsProps) {
  return (
    <div className="segmented-tabs" role="tablist">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`segmented-tabs__item${
            value === option.id ? ' is-active' : ''
          }`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
