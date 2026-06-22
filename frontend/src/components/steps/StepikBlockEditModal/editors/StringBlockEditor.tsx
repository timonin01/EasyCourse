import { Regex, Settings2, Type, Code } from 'lucide-react';
import { FormSection, Input, Toggle } from '../../../ui';
import type { StringEditData } from '../types';
import { ConditionSection } from '../sections/ConditionSection';
import { FeedbackSection } from '../sections/FeedbackSection';

interface StringBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  stringData: StringEditData;
  onStringDataChange: (data: StringEditData | ((prev: StringEditData) => StringEditData)) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function StringBlockEditor({
  text,
  onTextChange,
  stringData,
  onStringDataChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: StringBlockEditorProps) {
  return (
    <>
      <ConditionSection text={text} onTextChange={onTextChange} rows={4} placeholder="Введите условие задания..." />
      <FormSection title="Шаблон ответа" icon={<Regex className="w-4 h-4" />} description="Укажите ожидаемый ответ или регулярное выражение" variant="highlight">
        <Input value={stringData.pattern} onChange={(e) => onStringDataChange((p) => ({ ...p, pattern: e.target.value }))} placeholder="Регулярное выражение или точная строка" icon={<Regex className="w-4 h-4" />} />
      </FormSection>
      <FormSection title="Настройки проверки" icon={<Settings2 className="w-4 h-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Regex className="w-4 h-4" /></div>
            <Toggle checked={stringData.use_re} onChange={(v) => onStringDataChange((p) => ({ ...p, use_re: v }))} label="Регулярные выражения" description="Использовать regex" size="sm" />
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Type className="w-4 h-4" /></div>
            <Toggle checked={stringData.match_substring} onChange={(v) => onStringDataChange((p) => ({ ...p, match_substring: v }))} label="Совпадение подстроки" description="Частичное совпадение" size="sm" />
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Type className="w-4 h-4" /></div>
            <Toggle checked={stringData.case_sensitive} onChange={(v) => onStringDataChange((p) => ({ ...p, case_sensitive: v }))} label="Учитывать регистр" description="Case-sensitive" size="sm" />
          </div>
        </div>
      </FormSection>
      <FormSection title="Код проверки" icon={<Code className="w-4 h-4" />} description="Python-код для дополнительной валидации (необязательно)">
        <textarea
          value={stringData.code}
          onChange={(e) => onStringDataChange((p) => ({ ...p, code: e.target.value }))}
          rows={4}
          placeholder="# Python-код проверки..."
          className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm focus:ring-2 focus:ring-primary-500/50"
        />
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
