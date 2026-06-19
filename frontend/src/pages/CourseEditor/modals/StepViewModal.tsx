import { Edit, Repeat, Sparkles, Code, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { Modal, Button } from '../../../components/ui';
import { StepView } from '../../../components/StepView';
import { STEP_TYPE_CHANGE_PRO_MESSAGE } from '../../../constants/subscription';
import type { Step } from '../../../types';

interface StepViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStep: Step | null;
  canChangeType: boolean;
  canChangeStepType: boolean;
  canEditTask: boolean;
  isCodeBlock: boolean;
  onOpenStepTypeChange: () => void;
  onProStepTypeAttempt?: () => void;
  onEditTask: () => void;
  onOpenContentEdit: () => void;
}

export function StepViewModal({
  isOpen,
  onClose,
  selectedStep,
  canChangeType,
  canChangeStepType,
  canEditTask,
  isCodeBlock,
  onOpenStepTypeChange,
  onProStepTypeAttempt,
  onEditTask,
  onOpenContentEdit,
}: StepViewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Просмотр шага - ${selectedStep?.type ?? ''}`}
      size="lg"
    >
      {selectedStep ? (
        <div className="space-y-4">
          <StepView step={selectedStep} />
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700 flex-wrap">
            <Button variant="secondary" onClick={onClose}>Закрыть</Button>
            {canChangeType && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (!canChangeStepType) {
                    onProStepTypeAttempt?.();
                    return;
                  }
                  onOpenStepTypeChange();
                }}
                title={!canChangeStepType ? STEP_TYPE_CHANGE_PRO_MESSAGE : undefined}
                className={clsx(
                  !canChangeStepType &&
                    'border-amber-500/30 bg-amber-500/5 text-amber-400/90 hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-300'
                )}
              >
                {canChangeStepType ? (
                  <Repeat className="w-4 h-4 mr-2" />
                ) : (
                  <Lock className="w-4 h-4 mr-2 text-amber-400" />
                )}
                Изменить тип
                {!canChangeStepType && (
                  <span className="ml-2 text-xs font-medium text-amber-400/90">Pro</span>
                )}
              </Button>
            )}
            {canEditTask && (
              <Button 
                variant="secondary" 
                onClick={onEditTask}
                className="text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 border-green-500/30 hover:border-green-500/50"
              >
                {isCodeBlock ? <Code className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                Редактировать задание
              </Button>
            )}
            <Button variant="secondary" onClick={onOpenContentEdit}>
              <Sparkles className="w-4 h-4 mr-2" /> Изменить контент через AI
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
