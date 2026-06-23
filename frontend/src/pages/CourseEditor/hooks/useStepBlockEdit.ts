import { useState } from 'react';
import toast from 'react-hot-toast';
import { stepsApi } from '../../../api';
import type { Step, StepikBlockRequest } from '../../../types';
import { EDIT_TASK_BLOCK_NAMES } from '../types';
import { getStepBlockName } from '../../../types';
import { parseStepikBlockFromStep } from '../utils/parseStepBlock';

interface UseStepBlockEditParams {
  applyStepUpdate: (step: Step) => void;
  onSaved?: () => void;
}

export function useStepBlockEdit({ applyStepUpdate, onSaved }: UseStepBlockEditParams) {
  const [isBlockEditOpen, setIsBlockEditOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [editingBlock, setEditingBlock] = useState<StepikBlockRequest | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openStepBlockEdit = (step: Step) => {
    const blockName = getStepBlockName(step);
    if (!(EDIT_TASK_BLOCK_NAMES as readonly string[]).includes(blockName)) {
      toast.error('Редактирование недоступно для этого типа шага');
      return;
    }
    setEditingStep(step);
    setEditingBlock(parseStepikBlockFromStep(step));
    setIsBlockEditOpen(true);
  };

  const closeBlockEdit = () => {
    setIsBlockEditOpen(false);
    setEditingStep(null);
    setEditingBlock(null);
  };

  const handleSaveBlockEdit = async (block: StepikBlockRequest) => {
    if (!editingStep) return;

    setIsSaving(true);
    try {
      const updatedStep = await stepsApi.updateStep({
        stepId: editingStep.id,
        content: block.text || '',
        stepikBlock: block,
      });
      applyStepUpdate(updatedStep);
      toast.success('Задание обновлено');
      setEditingStep(null);
      setEditingBlock(null);
      onSaved?.();
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save step block:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isBlockEditOpen,
    editingBlock,
    isSavingBlockEdit: isSaving,
    openStepBlockEdit,
    closeBlockEdit,
    handleSaveBlockEdit,
  };
}
