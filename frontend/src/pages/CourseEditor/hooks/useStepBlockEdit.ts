import { useState } from 'react';
import toast from 'react-hot-toast';
import { stepsApi } from '../../../api';
import type { Step, StepType, StepikBlockRequest } from '../../../types';
import { EDIT_TASK_BLOCK_NAMES } from '../types';
import { getStepBlockName } from '../../../types';
import { parseStepikBlockFromStep } from '../utils/parseStepBlock';
import { createDefaultStepikBlock, stepTypeToBlockName } from '../../../utils/defaultStepikBlock';
import { extractApiErrorMessage } from '../../../utils/apiError';

interface UseStepBlockEditParams {
  applyStepUpdate: (step: Step) => void;
  applyStepCreate?: (step: Step) => void;
  onSaved?: (step: Step, mode: 'create' | 'update') => void;
}

export function useStepBlockEdit({ applyStepUpdate, applyStepCreate, onSaved }: UseStepBlockEditParams) {
  const [isBlockEditOpen, setIsBlockEditOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [editingBlock, setEditingBlock] = useState<StepikBlockRequest | null>(null);
  const [createLessonId, setCreateLessonId] = useState<number | null>(null);
  const [createType, setCreateType] = useState<StepType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isCreating = createLessonId != null && createType != null;

  const openStepBlockEdit = (step: Step) => {
    const blockName = getStepBlockName(step);
    if (!(EDIT_TASK_BLOCK_NAMES as readonly string[]).includes(blockName)) {
      toast.error('Редактирование недоступно для этого типа шага');
      return;
    }
    setCreateLessonId(null);
    setCreateType(null);
    setEditingStep(step);
    setEditingBlock(parseStepikBlockFromStep(step));
    setIsBlockEditOpen(true);
  };

  const openCreateStepBlockEdit = (lessonId: number, type: StepType) => {
    const blockName = stepTypeToBlockName(type);
    if (!(EDIT_TASK_BLOCK_NAMES as readonly string[]).includes(blockName)) {
      toast.error('Создание недоступно для этого типа шага');
      return;
    }
    setEditingStep(null);
    setCreateLessonId(lessonId);
    setCreateType(type);
    setEditingBlock(createDefaultStepikBlock(type));
    setIsBlockEditOpen(true);
  };

  const closeBlockEdit = () => {
    setIsBlockEditOpen(false);
    setEditingStep(null);
    setEditingBlock(null);
    setCreateLessonId(null);
    setCreateType(null);
  };

  const handleSaveBlockEdit = async (block: StepikBlockRequest) => {
    if (isCreating && createLessonId != null && createType != null) {
      setIsSaving(true);
      try {
        const created = await stepsApi.createStep({
          lessonId: createLessonId,
          type: createType,
          content: block.text || '',
          stepikBlock: block,
        });
        if (applyStepCreate) {
          applyStepCreate(created);
        } else {
          applyStepUpdate(created);
        }
        toast.success('Шаг создан');
        setCreateLessonId(null);
        setCreateType(null);
        setEditingBlock(null);
        onSaved?.(created, 'create');
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Не удалось создать шаг'));
        console.error('Failed to create step:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
      return;
    }

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
      onSaved?.(updatedStep, 'update');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось сохранить'));
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
    isCreating,
    blockEditTitle: isCreating ? 'Создать шаг' : undefined,
    openStepBlockEdit,
    openCreateStepBlockEdit,
    closeBlockEdit,
    handleSaveBlockEdit,
  };
}
