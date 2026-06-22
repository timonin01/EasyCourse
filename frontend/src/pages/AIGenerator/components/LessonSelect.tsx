import type { LessonWithContext } from '../utils/groupLessons';

interface LessonSelectProps {
  groupedLessons: Record<string, LessonWithContext[]>;
  selectedLessonId: number | null;
  onLessonChange: (lessonId: number | null) => void;
  className?: string;
  emptyMessage?: string;
}

export function LessonSelect({
  groupedLessons,
  selectedLessonId,
  onLessonChange,
  className = 'w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-200 text-sm',
  emptyMessage = 'Нет доступных уроков',
}: LessonSelectProps) {
  const lessons = Object.values(groupedLessons).flat();

  if (lessons.length === 0) {
    return <p className="text-sm text-dark-400">{emptyMessage}</p>;
  }

  return (
    <select
      className={className}
      value={selectedLessonId || ''}
      onChange={(e) => onLessonChange(Number(e.target.value) || null)}
    >
      <option value="">Выберите урок...</option>
      {Object.entries(groupedLessons).map(([courseTitle, courseLessons]) => (
        <optgroup key={courseTitle} label={`📚 ${courseTitle}`}>
          {courseLessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.modelTitle} → {lesson.title}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
