import { MessageCircle } from 'lucide-react';
import { FormSection, Textarea } from '../../../ui';

interface FeedbackSectionProps {
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function FeedbackSection({
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: FeedbackSectionProps) {
  return (
    <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Textarea
          label="При правильном ответе"
          value={feedbackCorrect}
          onChange={(e) => onFeedbackCorrectChange(e.target.value)}
          rows={2}
          placeholder="Отлично!..."
        />
        <Textarea
          label="При неправильном ответе"
          value={feedbackWrong}
          onChange={(e) => onFeedbackWrongChange(e.target.value)}
          rows={2}
          placeholder="Попробуйте ещё раз..."
        />
      </div>
    </FormSection>
  );
}
