import { Modal, Button, Input } from '../../../components/ui';

interface StepEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  cost: string;
  onTitleChange: (v: string) => void;
  onCostChange: (v: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function StepEditModal({
  isOpen,
  onClose,
  title,
  cost,
  onTitleChange,
  onCostChange,
  onSave,
  isSaving,
}: StepEditModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редактировать шаг">
      <div className="space-y-4">
        <Input
          label="Название"
          placeholder="Введите название шага"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <Input
          label="Стоимость"
          type="number"
          placeholder="Введите стоимость"
          value={cost}
          onChange={(e) => onCostChange(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={onSave} isLoading={isSaving}>Сохранить</Button>
        </div>
      </div>
    </Modal>
  );
}
