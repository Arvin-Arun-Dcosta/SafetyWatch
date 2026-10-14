export type FormStep = "details" | "location" | "review";

const STEPS: { id: FormStep; label: string }[] = [
  { id: "details", label: "Incident Details" },
  { id: "location", label: "Location" },
  { id: "review", label: "Review" },
];

export function StepIndicator({
  step,
  onStepChange,
  canOpenLocation,
  canOpenReview,
}: {
  step: FormStep;
  onStepChange: (step: FormStep) => void;
  canOpenLocation: boolean;
  canOpenReview: boolean;
}) {
  const disabled: Record<FormStep, boolean> = {
    details: false,
    location: !canOpenLocation,
    review: !canOpenReview,
  };

  return (
    <div className="px-8 pt-6 pb-2 border-b">
      <div className="flex items-center justify-between">
        {STEPS.map(({ id, label }, index) => (
          <div key={id} className="flex items-center">
            <button
              type="button"
              disabled={disabled[id]}
              aria-label={`Step ${index + 1}: ${label}`}
              aria-current={step === id ? "step" : undefined}
              onClick={() => onStepChange(id)}
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === id ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
              } font-medium`}
            >
              {index + 1}
            </button>
            {index < 2 && (
              <div
                className={`w-16 h-0.5 mx-2 ${
                  step === id || (step === "review" && index === 0) ? "bg-primary" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-500">
        {STEPS.map(({ id, label }) => (
          <span key={id} className={step === id ? "text-primary font-medium" : ""}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
