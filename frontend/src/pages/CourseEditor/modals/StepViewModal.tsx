import { Edit, Repeat, Sparkles, Code } from 'lucide-react';
import { Modal, Button } from '../../../components/ui';
import { StepView } from '../../../components/StepView';
import type { Step } from '../../../types';

interface StepViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStep: Step | null;
  canChangeType: boolean;
  canEditTask: boolean;
  isCodeBlock: boolean;
  onOpenStepTypeChange: () => void;
  onEditTask: () => void;
  onOpenContentEdit: () => void;
}

export function StepViewModal({
  isOpen,
  onClose,
  selectedStep,
  canChangeType,
  canEditTask,
  isCodeBlock,
  onOpenStepTypeChange,
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
              <Button variant="secondary" onClick={onOpenStepTypeChange}>
                <Repeat className="w-4 h-4 mr-2" /> Изменить тип
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
