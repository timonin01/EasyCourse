import { Repeat, AlertTriangle } from 'lucide-react';
import { Modal, Button, Badge } from '../../../components/ui';
import type { Step, StepType } from '../../../types';
import { STEP_TYPES } from '../types';

interface StepTypeChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStep: Step | null;
  newType: StepType;
  onNewTypeChange: (v: StepType) => void;
  onChangeType: () => void;
  isSaving: boolean;
}

export function StepTypeChangeModal({
  isOpen,
  onClose,
  selectedStep,
  newType,
  onNewTypeChange,
  onChangeType,
  isSaving,
}: StepTypeChangeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Изменить тип шага">
      <div className="space-y-4">
        {selectedStep?.stepikStepId && (
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-400 mb-1">Внимание: шаг синхронизирован со Stepik</p>
                <p className="text-sm text-dark-400">
                  При изменении типа шага, он будет удален со Stepik и потребуется повторная синхронизация.
                </p>
              </div>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">Текущий тип: <Badge variant="info">{selectedStep?.type}</Badge></label>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">Новый тип шага</label>
          <select
            className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-dark-100"
            value={newType}
            onChange={(e) => onNewTypeChange(e.target.value as StepType)}
          >
            {STEP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={onChangeType} isLoading={isSaving} disabled={newType === selectedStep?.type}>
            <Repeat className="w-4 h-4 mr-2" /> Изменить тип
          </Button>
        </div>
      </div>
    </Modal>
  );
}
