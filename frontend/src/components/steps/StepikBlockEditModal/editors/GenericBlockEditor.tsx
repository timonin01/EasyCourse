import { Settings2 } from 'lucide-react';
import { FormSection, Textarea } from '../../../ui';
import { ConditionSection } from '../sections/ConditionSection';
import { FeedbackSection } from '../sections/FeedbackSection';

interface GenericBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  sourceJson: string;
  onSourceJsonChange: (value: string) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function GenericBlockEditor({
  text,
  onTextChange,
  sourceJson,
  onSourceJsonChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: GenericBlockEditorProps) {
  return (
    <>
      <ConditionSection text={text} onTextChange={onTextChange} rows={5} placeholder="Текст задания..." />
      <FormSection title="Данные блока (source, JSON)" icon={<Settings2 className="w-4 h-4" />} description="Расширенное редактирование структуры шага">
        <Textarea value={sourceJson} onChange={(e) => onSourceJsonChange(e.target.value)} rows={10} className="font-mono text-xs" />
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
