import { Modal, Button, Input, Textarea } from '../../../components/ui';

interface CreateModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
}

export function CreateModelModal({
  isOpen,
  onClose,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  isSaving,
}: CreateModelModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать модуль">
      <div className="space-y-4">
        <Input label="Название" value={title} onChange={(e) => onTitleChange(e.target.value)} />
        <Textarea label="Описание" value={description} onChange={(e) => onDescriptionChange(e.target.value)} rows={3} />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={onSubmit} isLoading={isSaving}>Создать</Button>
        </div>
      </div>
    </Modal>
  );
}
