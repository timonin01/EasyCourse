import { FileText } from 'lucide-react';
import { FormSection, HtmlTextField } from '../../../ui';

interface ConditionSectionProps {
  text: string;
  onTextChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function ConditionSection({
  text,
  onTextChange,
  rows = 4,
  placeholder = 'Введите условие задания...',
}: ConditionSectionProps) {
  return (
    <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
      <HtmlTextField value={text} onChange={onTextChange} rows={rows} placeholder={placeholder} />
    </FormSection>
  );
}
