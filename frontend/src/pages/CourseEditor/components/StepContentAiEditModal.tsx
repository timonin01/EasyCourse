import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button, Textarea, LlmModelSelect } from '../../../components/ui';
import { MODEL_PRO_MESSAGE } from '../../../constants/subscription';
import { AI_PROMPT_LIMITS } from '../../../constants/aiPromptLimits';
import type { Step, StepikBlockRequest } from '../../../types';

interface ContentEditData {
  userInput: string;
  generatedContent: StepikBlockRequest | null;
}

interface StepContentAiEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStep: Step | null;
  contentEditData: ContentEditData;
  onContentEditDataChange: (data: ContentEditData | ((prev: ContentEditData) => ContentEditData)) => void;
  selectedLlmModel: string;
  onLlmModelChange: (model: string) => void;
  canSelectModel: boolean;
  isGeneratingContent: boolean;
  isSaving: boolean;
  onGenerate: () => void;
  onSave: () => void;
}

export function StepContentAiEditModal({
  isOpen,
  onClose,
  selectedStep,
  contentEditData,
  onContentEditDataChange,
  selectedLlmModel,
  onLlmModelChange,
  canSelectModel,
  isGeneratingContent,
  isSaving,
  onGenerate,
  onSave,
}: StepContentAiEditModalProps) {
  const handleClose = () => {
    onClose();
    onContentEditDataChange({ userInput: '', generatedContent: null });
    onLlmModelChange('');
  };

  let currentStepikBlock: StepikBlockRequest | null = null;
  if (selectedStep?.stepikBlockData) {
    try {
      const parsed = typeof selectedStep.stepikBlockData === 'string'
        ? JSON.parse(selectedStep.stepikBlockData)
        : selectedStep.stepikBlockData;
      currentStepikBlock = parsed as StepikBlockRequest;
    } catch (error) {
      console.error('Failed to parse stepikBlockData:', error);
    }
  }

  const textContent = currentStepikBlock?.text || selectedStep?.content || '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Изменить контент шага через AI"
      size="lg"
    >
      {selectedStep && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Текущий контент:</label>
            <div className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[100px] max-h-[200px] overflow-y-auto prose prose-invert max-w-none">
              {textContent ? (
                <div dangerouslySetInnerHTML={{ __html: textContent }} />
              ) : (
                <p className="text-dark-500">Нет содержимого</p>
              )}
            </div>
          </div>

          {currentStepikBlock && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Текущий StepikBlockRequest:</label>
              <div className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[100px] max-h-[200px] overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(currentStepikBlock, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Введите запрос для изменения контента:
              </label>
              <Textarea
                placeholder="Например: 'Сделай вопрос более сложным' или 'Добавь больше вариантов ответа'"
                value={contentEditData.userInput}
                onChange={(e) => onContentEditDataChange((prev) => ({ ...prev, userInput: e.target.value }))}
                rows={4}
                disabled={isGeneratingContent}
                maxLength={AI_PROMPT_LIMITS.generate}
                showCount
              />
            </div>
            <LlmModelSelect
              label="Модель LLM (опционально)"
              value={selectedLlmModel}
              onChange={onLlmModelChange}
              menuPlacement="bottom"
              canSelectModel={canSelectModel}
              onProModelAttempt={() => toast.error(MODEL_PRO_MESSAGE)}
            />
          </div>

          {!contentEditData.generatedContent && (
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handleClose} disabled={isGeneratingContent}>
                Отмена
              </Button>
              <Button
                onClick={onGenerate}
                isLoading={isGeneratingContent}
                disabled={!contentEditData.userInput.trim()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Сгенерировать новый контент
              </Button>
            </div>
          )}

          {contentEditData.generatedContent && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Новый контент (предпросмотр):</label>
                <div className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[100px] max-h-[300px] overflow-y-auto prose prose-invert max-w-none">
                  {contentEditData.generatedContent.text ? (
                    <div dangerouslySetInnerHTML={{ __html: contentEditData.generatedContent.text }} />
                  ) : (
                    <p className="text-dark-500">Контент сгенерирован (не текстовый тип)</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Новый StepikBlockRequest:</label>
                <div className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[100px] max-h-[200px] overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(contentEditData.generatedContent, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => onContentEditDataChange((prev) => ({ ...prev, generatedContent: null }))}
                  disabled={isSaving}
                >
                  Сгенерировать заново
                </Button>
                <Button onClick={onSave} isLoading={isSaving}>
                  Сохранить изменения
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
