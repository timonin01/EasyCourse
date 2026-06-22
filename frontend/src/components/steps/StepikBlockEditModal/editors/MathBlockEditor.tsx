import { Calculator, Hash } from 'lucide-react';
import { FormSection, Input } from '../../../ui';
import type { MathEditData } from '../types';
import { ConditionSection } from '../sections/ConditionSection';
import { FeedbackSection } from '../sections/FeedbackSection';

interface MathBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  mathData: MathEditData;
  onMathDataChange: (data: MathEditData | ((prev: MathEditData) => MathEditData)) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function MathBlockEditor({
  text,
  onTextChange,
  mathData,
  onMathDataChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: MathBlockEditorProps) {
  return (
    <>
      <ConditionSection text={text} onTextChange={onTextChange} rows={5} placeholder="Введите условие математической задачи..." />
      <FormSection title="Правильный ответ" icon={<Calculator className="w-4 h-4" />} variant="highlight">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Ответ (число или формула)" value={mathData.answer} onChange={(e) => onMathDataChange((p) => ({ ...p, answer: e.target.value }))} placeholder="например: 42 или 1.5" icon={<Hash className="w-4 h-4" />} />
          <Input label="Допустимая погрешность" value={mathData.maxError} onChange={(e) => onMathDataChange((p) => ({ ...p, maxError: e.target.value }))} placeholder="1e-06" hint="Для сравнения с плавающей точкой" />
        </div>
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
