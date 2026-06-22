import { useState, type Dispatch, type SetStateAction } from 'react';
import toast from 'react-hot-toast';
import type { StepikBlockRequest } from '../../../types';
import type { BatchResultItem } from '../types';

interface UseBlockEditModalParams {
  generatedStep: StepikBlockRequest | null;
  setGeneratedStep: (step: StepikBlockRequest | null) => void;
  batchResults: BatchResultItem[];
  setBatchResults: Dispatch<SetStateAction<BatchResultItem[]>>;
}

export function useBlockEditModal({
  generatedStep,
  setGeneratedStep,
  batchResults,
  setBatchResults,
}: UseBlockEditModalParams) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<StepikBlockRequest | null>(null);
  const [editingBatchIndex, setEditingBatchIndex] = useState<number | null>(null);

  const openEditGeneratedStep = () => {
    if (!generatedStep) return;
    setEditingBatchIndex(null);
    setEditingBlock(generatedStep);
    setIsEditModalOpen(true);
  };

  const openEditBatchStep = (index: number) => {
    const result = batchResults.find((r) => r.index === index);
    if (!result || result.error) return;
    setEditingBatchIndex(index);
    setEditingBlock(result.step);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBlock(null);
    setEditingBatchIndex(null);
  };

  const handleApplyEditedBlock = (block: StepikBlockRequest) => {
    if (editingBatchIndex !== null) {
      setBatchResults((prev) =>
        prev.map((r) => (r.index === editingBatchIndex ? { ...r, step: block } : r))
      );
      toast.success('Шаг обновлён');
    } else {
      setGeneratedStep(block);
      toast.success('Сгенерированный шаг обновлён');
    }
    setEditingBlock(null);
    setEditingBatchIndex(null);
  };

  return {
    isEditModalOpen,
    editingBlock,
    openEditGeneratedStep,
    openEditBatchStep,
    closeEditModal,
    handleApplyEditedBlock,
  };
}
