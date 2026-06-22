import type { CourseLessonContext } from '../../utils/parseCourseAuditHints';

interface LessonPickerSelectProps {
  label?: string;
  value: string;
  onChange: (lessonId: string) => void;
  lessons: CourseLessonContext[];
  disabled?: boolean;
  placeholder?: string;
}

export function LessonPickerSelect({
  label,
  value,
  onChange,
  lessons,
  disabled = false,
  placeholder = 'Выберите урок...',
}: LessonPickerSelectProps) {
  const grouped = lessons.reduce<Record<string, CourseLessonContext[]>>((acc, lesson) => {
    const key = lesson.sectionTitle || 'Без модуля';
    if (!acc[key]) acc[key] = [];
    acc[key].push(lesson);
    return acc;
  }, {});

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-dark-300">{label}</label>
      )}
      <select
        className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-dark-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
        value={value}
        disabled={disabled || lessons.length === 0}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {Object.entries(grouped).map(([sectionTitle, sectionLessons]) => (
          <optgroup key={sectionTitle} label={`📂 ${sectionTitle}`}>
            {sectionLessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                Урок {lesson.position}: {lesson.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
