export interface Step {
  key: string;
  label: string;
}

export function StepIndicator({
  steps,
  currentKey,
}: {
  steps: Step[];
  currentKey: string;
}) {
  const currentIndex = steps.findIndex((s) => s.key === currentKey);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
              i <= currentIndex
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs ${
              i <= currentIndex
                ? 'text-gray-900 font-medium'
                : 'text-gray-400'
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-px ${
                i < currentIndex ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
