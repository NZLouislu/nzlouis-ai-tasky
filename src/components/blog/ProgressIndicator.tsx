/**
 * ProgressIndicator - Shows real-time progress of AI processing
 * Displays current stage and progress percentage
 */

'use client';

interface Stage {
  id: string;
  label: string;
  icon: string;
}

interface ProgressIndicatorProps {
  currentStage: 'perception' | 'planning' | 'retrieval' | 'generation' | 'validation' | 'suggestion';
  progress?: number; // 0-100
}

export function ProgressIndicator({ currentStage, progress = 0 }: ProgressIndicatorProps) {
  const stages: Stage[] = [
    { id: 'perception', label: 'Understanding Intent', icon: '🧠' },
    { id: 'planning', label: 'Creating Plan', icon: '📋' },
    { id: 'retrieval', label: 'Searching Info', icon: '🔍' },
    { id: 'generation', label: 'Generating Content', icon: '✍️' },
    { id: 'validation', label: 'Quality Check', icon: '✅' },
  ];

  const currentStageIndex = stages.findIndex(s => s.id === currentStage);

  return (
    <div className="space-y-2">
      {stages.map((stage, idx) => {
        const isCompleted = idx < currentStageIndex;
        const isCurrent = idx === currentStageIndex;
        const isPending = idx > currentStageIndex;

        return (
          <div key={stage.id} className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                isCompleted
                  ? 'bg-green-600 text-white'
                  : isCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {stage.icon}
            </div>

            {/* Label and Progress */}
            <div className="flex-1">
              <div className={`text-sm font-medium ${
                isCompleted
                  ? 'text-green-700'
                  : isCurrent
                    ? 'text-blue-700'
                    : 'text-gray-500'
              }`}>
                {stage.label}
              </div>
              
              {/* Progress Bar for Current Stage */}
              {isCurrent && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Checkmark for Completed */}
            {isCompleted && (
              <div className="text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * CompactProgressIndicator - Minimal version for small spaces
 */
interface CompactProgressIndicatorProps {
  currentStage: string;
  totalStages?: number;
}

export function CompactProgressIndicator({ currentStage, totalStages = 5 }: CompactProgressIndicatorProps) {
  const stages = ['perception', 'planning', 'retrieval', 'generation', 'validation'];
  const currentIndex = stages.indexOf(currentStage);
  const progress = ((currentIndex + 1) / totalStages) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="font-medium capitalize">{currentStage}...</span>
        <span>{currentIndex + 1}/{totalStages}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
