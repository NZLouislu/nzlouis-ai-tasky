/**
 * Onboarding Flow Component
 * Guides new users through Stories feature setup
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, BookOpen, Settings, Zap } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
  isCompleted: boolean;
  isOptional?: boolean;
}

interface OnboardingStepProps {
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingFlow({ isOpen, onClose, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Stories',
      description: 'Learn how to create and manage user stories',
      component: WelcomeStep,
      isCompleted: false
    },
    {
      id: 'create-project',
      title: 'Create Your First Project',
      description: 'Set up a project to organize your stories',
      component: CreateProjectStep,
      isCompleted: false
    },
    {
      id: 'write-story',
      title: 'Write Your First Story',
      description: 'Learn the story format and best practices',
      component: WriteStoryStep,
      isCompleted: false
    },
    {
      id: 'connect-platforms',
      title: 'Connect Platforms',
      description: 'Link Jira or Trello for synchronization',
      component: ConnectPlatformsStep,
      isCompleted: false,
      isOptional: true
    },
    {
      id: 'sync-stories',
      title: 'Sync Your Stories',
      description: 'Push stories to your connected platforms',
      component: SyncStoriesStep,
      isCompleted: false,
      isOptional: true
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Start creating amazing user stories',
      component: CompleteStep,
      isCompleted: false
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = () => {
    const stepId = steps[currentStep].id;
    setCompletedSteps(prev => new Set([...prev, stepId]));
    
    if (currentStep === steps.length - 1) {
      onComplete();
      onClose();
    } else {
      handleNext();
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep].component;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Stories Onboarding
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Step Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                  index === currentStep
                    ? 'bg-blue-100 text-blue-700'
                    : completedSteps.has(step.id)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {completedSteps.has(step.id) ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
                <span>{step.title}</span>
                {step.isOptional && (
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                )}
              </div>
            ))}
          </div>

          {/* Current Step */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{steps[currentStep].title}</CardTitle>
              <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
            </CardHeader>
            <CardContent>
              <CurrentStepComponent
                onNext={handleNext}
                onPrev={handlePrev}
                onComplete={handleStepComplete}
                isFirst={currentStep === 0}
                isLast={currentStep === steps.length - 1}
              />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WelcomeStep({ onNext, isFirst }: OnboardingStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <BookOpen className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Welcome to Stories!</h3>
          <p className="text-gray-600">
            Stories helps you create, manage, and sync user stories with your favorite project management tools.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 border rounded-lg">
          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h4 className="font-medium">Write Stories</h4>
          <p className="text-sm text-gray-600">Create structured user stories with acceptance criteria</p>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h4 className="font-medium">Connect Platforms</h4>
          <p className="text-sm text-gray-600">Link with Jira, Trello, and other tools</p>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h4 className="font-medium">Sync & Collaborate</h4>
          <p className="text-sm text-gray-600">Keep everything in sync across platforms</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} className="flex items-center gap-2">
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CreateProjectStep({ onNext, onPrev, isFirst }: OnboardingStepProps) {
  const [projectName, setProjectName] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Create Your First Project</h3>
        <p className="text-gray-600">
          Projects help organize your stories and connect them to external platforms like Jira or Trello.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., Mobile App Redesign"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Pro Tip</h4>
          <p className="text-sm text-blue-800">
            Choose a descriptive name that reflects your product or feature. You can always change it later.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isFirst}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} disabled={!projectName.trim()}>
          Create Project
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function WriteStoryStep({ onNext, onPrev, isFirst }: OnboardingStepProps) {
  const [storyText, setStoryText] = useState(`- Story: User can view product details
  Description: As a customer, I want to view detailed product information so that I can make informed purchasing decisions.
  Acceptance_Criteria:
    - [ ] Display product name and description
    - [ ] Show product images and gallery
    - [ ] Display price and availability
    - [ ] Show customer reviews and ratings
  Priority: High
  Labels: [frontend, mobile]
  Assignees: John Doe
  Reporter: Product Manager`);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Write Your First Story</h3>
        <p className="text-gray-600">
          Learn the story format and try editing the example below.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Story Format</label>
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          />
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Story Structure</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• <strong>Story:</strong> Brief title describing the feature</li>
            <li>• <strong>Description:</strong> Detailed user story in "As a... I want... so that..." format</li>
            <li>• <strong>Acceptance_Criteria:</strong> Checkboxes with specific requirements</li>
            <li>• <strong>Priority:</strong> High, Medium, or Low</li>
            <li>• <strong>Labels:</strong> Tags for categorization</li>
            <li>• <strong>Assignees:</strong> Team members responsible</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isFirst}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function ConnectPlatformsStep({ onNext, onPrev, isFirst }: OnboardingStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Connect Platforms (Optional)</h3>
        <p className="text-gray-600">
          Connect your favorite project management tools to sync stories automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">J</span>
            </div>
            <div>
              <h4 className="font-medium">Jira</h4>
              <p className="text-sm text-gray-600">Sync stories as Jira issues</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            Connect Jira
          </Button>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">T</span>
            </div>
            <div>
              <h4 className="font-medium">Trello</h4>
              <p className="text-sm text-gray-600">Sync stories as Trello cards</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            Connect Trello
          </Button>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">Skip for Now</h4>
        <p className="text-sm text-yellow-800">
          You can connect platforms later from the proettings. This step is optional.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isFirst}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function SyncStoriesStep({ onNext, onPrev, isFirst }: OnboardingStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Syncs (Optional)</h3>
        <p className="text-gray-600">
          Once you've written stories and connected platforms, you can sync them with one click.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">How Syncing Works</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Stories are converted to platform-specific format</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Acceptance criteria become sub-tasks or checklists</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Labels and assignees are mapped automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Changes can be synced back to keep everything in sync</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Try It Later</h4>
          <p className="text-sm text-blue-800">
            After completing onboarding, create some stories and try the sync feature!
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isFirst}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function CompleteStep({ onComplete, onPrev, isFirst }: OnboardingStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">You're All Set!</h3>
          <p className="text-gray-600">
            You've completed the Stories onboarding. Start creating amazing user stories!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-center p-4 border rounded-lg">
          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h4 className="font-medium">Create Stories</h4>
          <p className="text-sm text-gray-600">Start writing your first user stories</p>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h4 className="font-medium">Explore Features</h4>
          <p className="text-sm text-gray-600">Discover advanced features and integrations</p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isFirst}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
          Start Using Stories
          <CheckCircle className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}