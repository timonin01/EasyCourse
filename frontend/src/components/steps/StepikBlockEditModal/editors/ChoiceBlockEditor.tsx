import { MessageCircle, ListChecks } from 'lucide-react';
import { FormSection, OptionCard, AddButton, Checkbox, HtmlInlinePreview } from '../../../ui';
import type { ChoiceOptionEdit } from '../types';
import { ConditionSection } from '../sections/ConditionSection';
import { FeedbackSection } from '../sections/FeedbackSection';

interface ChoiceBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  choiceOptions: ChoiceOptionEdit[];
  onChoiceOptionsChange: (options: ChoiceOptionEdit[]) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function ChoiceBlockEditor({
  text,
  onTextChange,
  choiceOptions,
  onChoiceOptionsChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: ChoiceBlockEditorProps) {
  return (
    <>
      <ConditionSection text={text} onTextChange={onTextChange} rows={4} placeholder="Введите вопрос..." />
      <FormSection title="Варианты ответов" icon={<ListChecks className="w-4 h-4" />} description="Отметьте правильные варианты галочкой" variant="highlight">
        <div className="space-y-3">
          {choiceOptions.map((opt, i) => (
            <OptionCard
              key={i}
              isCorrect={opt.is_correct}
              showCorrectIndicator
              onDelete={() => {
                const next = choiceOptions.filter((_, j) => j !== i);
                onChoiceOptionsChange(next.length ? next : [{ text: '', is_correct: false, feedback: '' }]);
              }}
            >
              <div className="flex gap-3 items-start">
                <Checkbox
                  checked={opt.is_correct}
                  onChange={(v) => {
                    const next = [...choiceOptions];
                    next[i] = { ...next[i], is_correct: v };
                    onChoiceOptionsChange(next);
                  }}
                  variant="success"
                />
                <div className="flex-1 space-y-2">
                  <textarea
                    value={opt.text}
                    onChange={(e) => {
                      const next = [...choiceOptions];
                      next[i] = { ...next[i], text: e.target.value };
                      onChoiceOptionsChange(next);
                    }}
                    rows={2}
                    placeholder="Введите текст варианта ответа..."
                    className={`w-full px-3 py-2 bg-dark-700/50 border rounded-lg text-sm placeholder-dark-500 resize-none focus:ring-2 focus:ring-primary-500/50 ${opt.is_correct ? 'border-emerald-500/40 text-emerald-100' : 'border-dark-600 text-dark-100'}`}
                  />
                  <HtmlInlinePreview html={opt.text} />
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-dark-500" />
                    <input
                      type="text"
                      value={opt.feedback}
                      onChange={(e) => {
                        const next = [...choiceOptions];
                        next[i] = { ...next[i], feedback: e.target.value };
                        onChoiceOptionsChange(next);
                      }}
                      placeholder="Комментарий при выборе этого варианта (опционально)"
                      className="flex-1 px-3 py-1.5 bg-dark-700/30 border border-dark-600/50 rounded-lg text-dark-300 text-xs placeholder-dark-500 focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                </div>
              </div>
            </OptionCard>
          ))}
        </div>
        <AddButton
          variant="dashed"
          fullWidth
          className="mt-3"
          onClick={() => onChoiceOptionsChange([...choiceOptions, { text: '', is_correct: false, feedback: '' }])}
        >
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
