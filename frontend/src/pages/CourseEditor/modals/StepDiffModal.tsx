import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button } from '../../../components/ui';
import { getStepDisplayType } from '../../../types';
import type { Step } from '../../../types';
import type { StepDiffInfo } from '../../../utils/stepikCompare';

interface StepDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: Step | null;
  diff: StepDiffInfo | undefined;
}

function copyJson(json: string, label: string) {
  navigator.clipboard.writeText(json).then(
    () => toast.success(`${label} скопировано`),
    () => toast.error('Не удалось скопировать')
  );
}

export function StepDiffModal({ isOpen, onClose, step, diff }: StepDiffModalProps) {
  const title = step ? `Отличия от Stepik — ${getStepDisplayType(step)}` : 'Отличия от Stepik';
  const hasDiff = diff && (diff.position || diff.cost || (diff.blockPaths && diff.blockPaths.length));

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        {!step ? (
          <p className="text-dark-400 text-sm">Шаг не найден.</p>
        ) : !hasDiff ? (
          <p className="text-dark-400 text-sm">Нет сохранённых отличий. Нажмите «Проверить» у шага.</p>
        ) : (
          <>
            {diff?.position && (
              <div>
                <span className="text-xs font-medium text-dark-500 uppercase">Позиция</span>
                <p className="text-dark-200 mt-0.5">
                  Локально: {diff.position.local} → Stepik: {diff.position.remote}
                </p>
              </div>
            )}
            {diff?.cost != null && (
              <div>
                <span className="text-xs font-medium text-dark-500 uppercase">Стоимость</span>
                <p className="text-dark-200 mt-0.5">
                  Локально: {diff.cost.local} → Stepik: {diff.cost.remote}
                </p>
              </div>
            )}
            {diff?.blockPaths && diff.blockPaths.length > 0 && (
              <div>
                <span className="text-xs font-medium text-dark-500 uppercase">stepikBlock (чем отличается)</span>
                <p className="text-dark-300 text-sm mt-0.5 break-words">
                  {diff.blockPaths.join(', ')}
                </p>
              </div>
            )}
            {diff?.localBlockJson != null && diff?.remoteBlockJson != null && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dark-700">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-dark-500 uppercase">Локальный block (JSON)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => copyJson(diff!.localBlockJson!, 'Локальный block')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <pre className="p-3 rounded-lg bg-dark-800 border border-dark-600 text-xs text-dark-300 overflow-x-auto overflow-y-auto max-h-64 whitespace-pre-wrap break-words">
                    {diff.localBlockJson}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-dark-500 uppercase">Stepik block (JSON)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      onClick={() => copyJson(diff!.remoteBlockJson!, 'Stepik block')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <pre className="p-3 rounded-lg bg-dark-800 border border-dark-600 text-xs text-dark-300 overflow-x-auto overflow-y-auto max-h-64 whitespace-pre-wrap break-words">
                    {diff.remoteBlockJson}
                  </pre>
                </div>
              </div>
            )}
          </>
        )}
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
}
