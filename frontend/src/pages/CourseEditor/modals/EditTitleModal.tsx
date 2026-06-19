import { Modal, Button, Input } from '../../../components/ui';
import { useState, useEffect, useRef } from 'react';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { extractApiErrorMessage } from '../../../utils/apiError';
import { validateTitle } from '../../../utils/validation';

interface EditTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  onSave: (newTitle: string) => Promise<void>;
  label: string; // "урока" или "модуля"
}

export function EditTitleModal({
  isOpen,
  onClose,
  currentTitle,
  onSave,
  label,
}: EditTitleModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      // Автофокус и выделение текста после открытия модалки
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, currentTitle]);

  const handleSave = async () => {
    const trimmed = title.trim();
    if (trimmed === currentTitle) {
      onClose();
      return;
    }

    const validationError = validateTitle(trimmed, `Название ${label}`);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmed);
      onClose();
    } catch (error) {
      toast.error(extractApiErrorMessage(error, `Не удалось сохранить название ${label}`));
      console.error('Failed to save title:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Редактировать название ${label}`}
      icon={<Pencil className="w-5 h-5" />}
      size="sm"
    >
      <div className="space-y-4">
        <Input
          ref={inputRef}
          label={`Название ${label}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Введите название ${label}`}
          autoFocus
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Отмена
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} disabled={!title.trim()}>
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
}
