import { Plus, Hash } from 'lucide-react';
import { FormSection, OptionCard, AddButton } from '../../../ui';
import type { NumberOptionEdit } from '../types';
import { ConditionSection } from '../sections/ConditionSection';
import { FeedbackSection } from '../sections/FeedbackSection';

interface NumberBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  numberOptions: NumberOptionEdit[];
  onNumberOptionsChange: (options: NumberOptionEdit[]) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function NumberBlockEditor({
  text,
  onTextChange,
  numberOptions,
  onNumberOptionsChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: NumberBlockEditorProps) {
  return (
    <>
      <ConditionSection text={text} onTextChange={onTextChange} rows={4} placeholder="Введите условие задачи..." />
      <FormSection title="Правильные ответы" icon={<Hash className="w-4 h-4" />} description="Укажите допустимые числовые ответы с погрешностью" variant="highlight">
        <div className="space-y-3">
          {numberOptions.map((opt, i) => (
            <OptionCard
              key={i}
              onDelete={() => {
                const next = numberOptions.filter((_, j) => j !== i);
                onNumberOptionsChange(next.length ? next : [{ answer: '', maxError: '' }]);
              }}
            >
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <div className="text-xs text-dark-500 mb-1">Правильный ответ</div>
                  <input
                    type="text"
                    value={opt.answer}
                    onChange={(e) => {
                      const next = [...numberOptions];
                      next[i] = { ...next[i], answer: e.target.value };
                      onNumberOptionsChange(next);
                    }}
                    placeholder="42"
                    className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-dark-500 mb-1">Погрешность (опционально)</div>
                  <input
                    type="text"
                    value={opt.maxError}
                    onChange={(e) => {
                      const next = [...numberOptions];
                      next[i] = { ...next[i], maxError: e.target.value };
                      onNumberOptionsChange(next);
                    }}
                    placeholder="0.01"
                    className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
              </div>
            </OptionCard>
          ))}
        </div>
        <AddButton variant="dashed" fullWidth className="mt-3" icon={<Plus className="w-4 h-4" />} onClick={() => onNumberOptionsChange([...numberOptions, { answer: '', maxError: '' }])}>
          Добавить вариант ответа
        </AddButton>
      </FormSection>
      <FeedbackSection
        feedbackCorrect={feedbackCorrect}
        feedbackWrong={feedbackWrong}
        onFeedbackCorrectChange={onFeedbackCorrectChange}
        onFeedbackWrongChange={onFeedbackWrongChange}
      />
    </>
  );
}
