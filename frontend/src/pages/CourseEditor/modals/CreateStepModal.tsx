import { Modal, Button } from '../../../components/ui';
import type { StepType } from '../../../types';
import { STEP_TYPES } from '../types';

interface CreateStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: StepType;
  onTypeChange: (v: StepType) => void;
  onContinue: () => void;
}

export function CreateStepModal({
  isOpen,
  onClose,
  type,
  onTypeChange,
  onContinue,
}: CreateStepModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать шаг" size="md">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-dark-300">Тип шага</p>
          <div
            className="max-h-[min(420px,55vh)] space-y-1 overflow-y-auto rounded-xl border border-dark-700/60 bg-dark-900 p-1.5"
            role="listbox"
            aria-label="Тип шага"
          >
            {STEP_TYPES.map((t) => {
              const selected = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onTypeChange(t.value)}
                  onDoubleClick={() => {
                    onTypeChange(t.value);
                    onContinue();
                  }}
                  className={
                    selected
                      ? 'flex w-full items-center rounded-lg border border-primary-500/50 bg-primary-500/15 px-3 py-2.5 text-left text-sm text-dark-100 transition-colors'
                      : 'flex w-full items-center rounded-lg border border-transparent px-3 py-2.5 text-left text-sm text-dark-200 transition-colors hover:border-dark-600 hover:bg-dark-800'
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-dark-400">
            Дальше откроется редактор задания. Двойной клик — сразу далее.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={onContinue}>Далее</Button>
        </div>
      </div>
    </Modal>
  );
}
