'use client'

const STEPS = [
  { id: 1, label: 'Script' },
  { id: 2, label: 'Visuals' },
  { id: 3, label: 'Storyboard' },
  { id: 4, label: 'Narration' },
]

export default function StepIndicator({ currentStep, maxStep, onGoTo }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const isCompleted = step.id < currentStep
        const isCurrent = step.id === currentStep
        const isAccessible = step.id <= maxStep
        const isLast = i === STEPS.length - 1

        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <button
              onClick={() => isAccessible && onGoTo(step.id)}
              disabled={!isAccessible}
              className={[
                'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors w-full justify-center',
                isCurrent ? 'bg-accent/20 text-accent' : '',
                isCompleted && !isCurrent ? 'text-slate-300 hover:text-white hover:bg-card cursor-pointer' : '',
                !isAccessible ? 'text-muted cursor-not-allowed opacity-40' : '',
              ].join(' ')}
            >
              <span className={[
                'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                isCurrent ? 'bg-accent text-white' : '',
                isCompleted ? 'bg-emerald-500/20 text-emerald-400' : '',
                !isAccessible && !isCurrent ? 'bg-border text-muted' : '',
                isAccessible && !isCurrent && !isCompleted ? 'bg-border text-muted' : '',
              ].join(' ')}>
                {isCompleted ? '✓' : step.id}
              </span>
              <span className="truncate">{step.label}</span>
            </button>

            {!isLast && (
              <div className={`h-px w-3 flex-shrink-0 mx-0.5 ${step.id < currentStep ? 'bg-emerald-500/40' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
