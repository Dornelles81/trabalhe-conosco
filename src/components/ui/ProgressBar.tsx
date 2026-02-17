'use client'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  labels: string[]
}

export default function ProgressBar({ currentStep, totalSteps, labels }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {labels.map((label, i) => (
          <div
            key={i}
            className={`text-xs font-medium ${
              i + 1 <= currentStep ? 'text-mega-teal' : 'text-mega-text-muted'
            } ${i === 0 ? 'text-left' : i === labels.length - 1 ? 'text-right' : 'text-center'} flex-1`}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="w-full bg-mega-border rounded-full h-2">
        <div
          className="bg-mega-teal h-2 rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <p className="text-center text-xs text-mega-text-muted mt-2">
        Etapa {currentStep} de {totalSteps}
      </p>
    </div>
  )
}
