import { Modal, Button, Input } from '../../../components/ui';

interface CreateLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onTitleChange: (v: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
}

export function CreateLessonModal({
  isOpen,
  onClose,
  title,
  onTitleChange,
  onSubmit,
  isSaving,
}: CreateLessonModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать урок">
      <div className="space-y-4">
        <Input label="Название" value={title} onChange={(e) => onTitleChange(e.target.value)} />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={onSubmit} isLoading={isSaving}>Создать</Button>
        </div>
      </div>
    </Modal>
  );
}
