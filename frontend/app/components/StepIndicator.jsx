'use client'

import { Check, FileText, Image as ImageIcon, Film, Mic } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Script', icon: FileText },
  { id: 2, label: 'Visuals', icon: ImageIcon },
  { id: 3, label: 'Storyboard', icon: Film },
  { id: 4, label: 'Narration', icon: Mic },
]

export default function StepIndicator({ currentStep, maxStep, onGoTo }) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isAccessible = step.id <= maxStep
          const isLast = i === STEPS.length - 1

          const circleClass = isCurrent
            ? 'bg-accent text-white shadow-md shadow-accent/30 ring-2 ring-accent/40'
            : isCompleted
            ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
            : isAccessible
            ? 'bg-card text-muted-strong ring-1 ring-border'
            : 'bg-card/40 text-muted/60 ring-1 ring-border/50'

          const labelClass = isCurrent
            ? 'text-white font-semibold'
            : isCompleted
            ? 'text-muted-strong'
            : isAccessible
            ? 'text-muted-strong'
            : 'text-muted/60'

          return (
            <li key={step.id} className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                onClick={() => isAccessible && onGoTo(step.id)}
                disabled={!isAccessible}
                aria-current={isCurrent ? 'step' : undefined}
                className={[
                  'group flex items-center gap-2.5 px-3 py-2 rounded-lg w-full transition-all',
                  isAccessible ? 'hover:bg-card/60 cursor-pointer' : 'cursor-not-allowed',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all flex-shrink-0',
                    circleClass,
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </span>
                <span className="flex flex-col items-start min-w-0">
                  <span className="text-[10px] uppercase tracking-widest text-muted/80 font-medium">
                    Step {step.id}
                  </span>
                  <span className={`text-sm tracking-tight truncate ${labelClass}`}>
                    {step.label}
                  </span>
                </span>
              </button>

              {!isLast && (
                <div
                  className={`h-0.5 flex-1 max-w-12 mx-1 rounded-full transition-colors ${
                    isCompleted ? 'bg-emerald-500/40' : 'bg-border'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
