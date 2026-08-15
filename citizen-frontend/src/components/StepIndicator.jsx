function StepIndicator({ steps, currentStep }) {
  return (
    <div className="step-indicator" role="navigation" aria-label="Form progress">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        let stateClass = '';
        if (isCompleted) stateClass = 'completed';
        else if (isActive) stateClass = 'active';

        return (
          <div key={step} className={`step-item ${stateClass}`}>
            <div className="step-circle" aria-current={isActive ? 'step' : undefined}>
              {isCompleted ? '✓' : stepNum}
            </div>
            <span className="step-label">{step}</span>
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;
