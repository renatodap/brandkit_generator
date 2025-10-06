/**
 * Progressive Generation Component
 *
 * Shows step-by-step progress during brand kit generation
 * Builds trust and reduces anxiety by making AI process visible
 */

'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerationStep {
  id: string;
  label: string;
  duration: number; // Estimated duration in ms
}

const GENERATION_STEPS: GenerationStep[] = [
  {
    id: 'analyzing',
    label: 'Analyzing your business...',
    duration: 2000,
  },
  {
    id: 'logo',
    label: 'Generating logo design...',
    duration: 12000, // Logo takes longest
  },
  {
    id: 'colors',
    label: 'Choosing color palette...',
    duration: 3000,
  },
  {
    id: 'fonts',
    label: 'Selecting typography...',
    duration: 3000,
  },
  {
    id: 'tagline',
    label: 'Crafting tagline...',
    duration: 4000,
  },
  {
    id: 'finalizing',
    label: 'Finalizing your brand kit...',
    duration: 2000,
  },
];

interface ProgressiveGenerationProps {
  isGenerating: boolean;
  currentStep?: string;
  onComplete?: () => void;
}

export function ProgressiveGeneration({
  isGenerating,
  currentStep,
  onComplete,
}: ProgressiveGenerationProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isGenerating) {
      setActiveStepIndex(0);
      setCompletedSteps(new Set());
      return;
    }

    // Auto-progress through steps based on estimated durations
    let cumulativeTime = 0;
    const timeouts: NodeJS.Timeout[] = [];

    GENERATION_STEPS.forEach((step, index) => {
      cumulativeTime += step.duration;

      const timeout = setTimeout(() => {
        if (isGenerating) {
          setCompletedSteps((prev) => {
            const newSet = new Set(prev);
            newSet.add(step.id);
            return newSet;
          });

          if (index < GENERATION_STEPS.length - 1) {
            setActiveStepIndex(index + 1);
          } else if (onComplete) {
            onComplete();
          }
        }
      }, cumulativeTime);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [isGenerating, onComplete]);

  // If externally controlled step is provided, sync with it
  useEffect(() => {
    if (currentStep) {
      const stepIndex = GENERATION_STEPS.findIndex((s) => s.id === currentStep);
      if (stepIndex !== -1) {
        setActiveStepIndex(stepIndex);
        // Mark all previous steps as completed
        const newCompleted = new Set<string>();
        for (let i = 0; i < stepIndex; i++) {
          const step = GENERATION_STEPS[i];
          if (step) {
            newCompleted.add(step.id);
          }
        }
        setCompletedSteps(newCompleted);
      }
    }
  }, [currentStep]);

  if (!isGenerating) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Generating Your Brand Kit</h3>
        <span className="text-sm text-muted-foreground">
          Usually takes 20-30 seconds
        </span>
      </div>

      <div className="space-y-3">
        {GENERATION_STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isActive = index === activeStepIndex;
          const isPending = index > activeStepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-all',
                isActive && 'bg-primary/5 border border-primary/20',
                isCompleted && 'opacity-60'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center h-6 w-6 rounded-full transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isActive && 'bg-primary/20 text-primary',
                  isPending && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>

              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive && 'text-foreground',
                  isCompleted && 'text-muted-foreground line-through',
                  isPending && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>

              {isActive && (
                <div className="ml-auto flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium">Tip:</span> Our AI is analyzing your industry and business
          description to create a cohesive brand identity that resonates with your audience.
        </p>
      </div>
    </div>
  );
}
