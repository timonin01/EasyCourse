import { FileText } from 'lucide-react';
import { FormSection, HtmlTextField } from '../../../ui';
import { FeedbackSection } from '../sections/FeedbackSection';

interface TextBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function TextBlockEditor({
  text,
  onTextChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: TextBlockEditorProps) {
  return (
    <>
      <FormSection title="Содержимое" icon={<FileText className="w-4 h-4" />}>
        <HtmlTextField value={text} onChange={onTextChange} rows={10} placeholder="Введите текст для отображения студенту..." />
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
