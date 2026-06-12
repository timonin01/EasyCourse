import { Modal, Button, Textarea } from '../../../components/ui';
import type { StepType } from '../../../types';
import { STEP_TYPES } from '../types';

interface CreateStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: StepType;
  description: string;
  onTypeChange: (v: StepType) => void;
  onDescriptionChange: (v: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
}

export function CreateStepModal({
  isOpen,
  onClose,
  type,
  description,
  onTypeChange,
  onDescriptionChange,
  onSubmit,
  isSaving,
}: CreateStepModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать шаг">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">Тип шага</label>
          <select
            className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-dark-100"
            value={type}
            onChange={(e) => onTypeChange(e.target.value as StepType)}
          >
            {STEP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <Textarea
          label="Контент"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          placeholder="Введите контент шага..."
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={onSubmit} isLoading={isSaving}>Создать</Button>
        </div>
      </div>
    </Modal>
  );
}
