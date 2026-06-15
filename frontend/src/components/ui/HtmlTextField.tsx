import { useState } from 'react';
import { clsx } from 'clsx';
import { Eye, Code2, AlertTriangle } from 'lucide-react';
import { Textarea } from './Textarea';

type ViewMode = 'preview' | 'source';

interface HtmlTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  error?: string;
  /** Начальный режим; по умолчанию превью, если есть текст */
  defaultMode?: ViewMode;
}

const previewClassName =
  'w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[80px] max-h-[400px] overflow-y-auto prose prose-invert prose-sm max-w-none';

export function HtmlTextField({
  value,
  onChange,
  label,
  placeholder,
  rows = 6,
  error,
  defaultMode,
}: HtmlTextFieldProps) {
  const [mode, setMode] = useState<ViewMode>(
    defaultMode ?? (value.trim() ? 'preview' : 'source')
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
          {label ? (
            <span className="block text-sm font-medium text-dark-300">{label}</span>
          ) : (
            <span className="text-sm text-dark-400">Текст</span>
          )}
          <div className="flex rounded-lg border border-dark-600 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 transition-colors',
                mode === 'preview'
                  ? 'bg-primary-500/20 text-primary-300'
                  : 'bg-dark-800 text-dark-400 hover:text-dark-200'
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              Превью
            </button>
            <button
              type="button"
              onClick={() => setMode('source')}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 transition-colors border-l border-dark-600',
                mode === 'source'
                  ? 'bg-primary-500/20 text-primary-300'
                  : 'bg-dark-800 text-dark-400 hover:text-dark-200'
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              HTML
            </button>
          </div>
        </div>

      {mode === 'preview' ? (
        <div className={previewClassName}>
          {value.trim() ? (
            <div dangerouslySetInnerHTML={{ __html: value }} />
          ) : (
            <p className="text-dark-500 m-0">{placeholder || 'Текст пока пуст'}</p>
          )}
        </div>
      ) : (
        <>
          <div
            role="alert"
            className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200/90"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <p className="text-xs leading-relaxed m-0">
              Вы редактируете HTML-разметку. Ошибки в тегах могут сломать отображение шага на Stepik.
              После правок проверьте результат во вкладке «Превью».
            </p>
          </div>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            error={error}
            hint="Используйте теги вроде &lt;p&gt;, &lt;b&gt;, &lt;ul&gt;, &lt;code&gt;. Не удаляйте закрывающие теги."
          />
        </>
      )}

      {mode === 'preview' && error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

/** Компактное превью под коротким полем (варианты ответа и т.п.) */
export function HtmlInlinePreview({ html, className }: { html: string; className?: string }) {
  if (!html.trim() || !/<[a-z][\s\S]*>/i.test(html)) return null;

  return (
    <div
      className={clsx(
        'mt-1.5 px-2.5 py-2 rounded-lg bg-dark-900/60 border border-dark-700/80 text-dark-200 prose prose-invert prose-sm max-w-none',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
