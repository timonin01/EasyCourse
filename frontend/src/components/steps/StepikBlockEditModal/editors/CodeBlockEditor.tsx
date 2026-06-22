import { Plus, Trash2, FileText } from 'lucide-react';
import { FormSection, Button, Input, HtmlTextField } from '../../../ui';
import type { CodeEditData } from '../types';
import { FeedbackSection } from '../sections/FeedbackSection';

interface CodeBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  codeData: CodeEditData;
  onCodeDataChange: (data: CodeEditData | ((prev: CodeEditData) => CodeEditData)) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function CodeBlockEditor({
  text,
  onTextChange,
  codeData,
  onCodeDataChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: CodeBlockEditorProps) {
  return (
    <>
      <FormSection title="Условие задачи" icon={<FileText className="w-4 h-4" />}>
        <HtmlTextField value={text} onChange={onTextChange} rows={4} placeholder="Опишите, что должен сделать студент..." />
      </FormSection>
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1.5">Язык программирования</label>
        <select
          className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-dark-100"
          value={codeData.templates_data}
          onChange={(e) => onCodeDataChange((p) => ({ ...p, templates_data: e.target.value }))}
        >
          <option value="::python3">Python 3</option>
          <option value="::java21">Java 21</option>
          <option value="::java17">Java 17</option>
          <option value="::java11">Java 11</option>
          <option value="::go">Go</option>
          <option value="::cpp">C++</option>
          <option value="::c">C</option>
          <option value="::csharp">C#</option>
          <option value="::kotlin">Kotlin</option>
          <option value="::rust">Rust</option>
          <option value="::javascript">JavaScript</option>
          <option value="::ruby">Ruby</option>
          <option value="::scala">Scala</option>
          <option value="::haskell">Haskell</option>
          <option value="::pascal">Pascal</option>
          <option value="::r">R</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1.5">Код (шаблон или чекер)</label>
        <textarea
          value={codeData.code}
          onChange={(e) => onCodeDataChange((p) => ({ ...p, code: e.target.value }))}
          rows={8}
          placeholder="Вставьте код шаблона или чекера..."
          className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">Тестовые случаи (ввод → ожидаемый вывод)</label>
        <div className="space-y-2">
          {codeData.test_cases.map((pair, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                placeholder="Ввод (stdin)"
                value={pair[0]}
                onChange={(e) => {
                  const next = [...codeData.test_cases];
                  next[i] = [e.target.value, next[i][1]];
                  onCodeDataChange((p) => ({ ...p, test_cases: next }));
                }}
                className="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 text-sm font-mono"
              />
              <span className="text-dark-500 pt-2">→</span>
              <input
                type="text"
                placeholder="Ожидаемый вывод"
                value={pair[1]}
                onChange={(e) => {
                  const next = [...codeData.test_cases];
                  next[i] = [next[i][0], e.target.value];
                  onCodeDataChange((p) => ({ ...p, test_cases: next }));
                }}
                className="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 text-sm font-mono"
              />
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-red-400 hover:text-red-300"
                onClick={() => {
                  const next = codeData.test_cases.filter((_, j) => j !== i);
                  onCodeDataChange((p) => ({ ...p, test_cases: next.length ? next : [['', '']] }));
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => onCodeDataChange((p) => ({ ...p, test_cases: [...p.test_cases, ['', '']] }))}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить тест
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Лимит времени (сек)"
          type="number"
          value={String(codeData.execution_time_limit)}
          onChange={(e) => onCodeDataChange((p) => ({ ...p, execution_time_limit: Math.max(1, parseInt(e.target.value, 10) || 5) }))}
        />
        <Input
          label="Лимит памяти (МБ)"
          type="number"
          value={String(codeData.execution_memory_limit)}
          onChange={(e) => onCodeDataChange((p) => ({ ...p, execution_memory_limit: Math.max(64, parseInt(e.target.value, 10) || 256) }))}
        />
      </div>
      <FeedbackSection
        feedbackCorrect={feedbackCorrect}
        feedbackWrong={feedbackWrong}
        onFeedbackCorrectChange={onFeedbackCorrectChange}
        onFeedbackWrongChange={onFeedbackWrongChange}
      />
    </>
  );
}
