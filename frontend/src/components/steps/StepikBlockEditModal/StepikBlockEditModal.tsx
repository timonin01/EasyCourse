import { useState } from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import { Modal, Button } from '../../ui';
import { BLOCK_META } from './blockMeta';
import type { StepikBlockEditModalProps } from './types';
import { useStepikBlockForm } from './useStepikBlockForm';
import { BlockEditorBody } from './editors/BlockEditorBody';

export function StepikBlockEditModal({
  isOpen,
  onClose,
  block,
  onSave,
  title,
}: StepikBlockEditModalProps) {
  const blockName = block?.name || 'text';
  const meta = BLOCK_META[blockName] ?? {
    title: blockName,
    subtitle: 'Редактирование шага',
    icon: <FileText className="w-5 h-5" />,
  };

  const form = useStepikBlockForm(block, isOpen, blockName);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const updated = form.buildUpdatedBlock();
    if (!updated || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(updated);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || meta.title}
      subtitle={meta.subtitle}
      icon={meta.icon}
      size={blockName === 'table' ? 'xl' : 'lg'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Отмена</Button>
          <Button variant="success" onClick={() => void handleSave()} isLoading={isSaving}>
            <CheckCircle className="w-4 h-4" />
            Применить
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <BlockEditorBody blockName={blockName} form={form} />
      </div>
    </Modal>
  );
}
