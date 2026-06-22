import { BookOpen, ChevronRight } from 'lucide-react';
import type { Course } from '../../types';

interface CoursePickerListProps {
  courses: Course[];
  selectedCourseId: string;
  onSelect: (courseId: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
}

export function CoursePickerList({
  courses,
  selectedCourseId,
  onSelect,
  disabled = false,
  emptyMessage = 'Нет доступных курсов',
}: CoursePickerListProps) {
  if (courses.length === 0) {
    return (
      <div className="rounded-xl border border-dark-700 bg-dark-800/50 py-8 text-center">
        <BookOpen className="mx-auto mb-2 h-8 w-8 text-dark-500" />
        <p className="text-sm text-dark-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {courses.map((course) => {
        const isSelected = selectedCourseId === String(course.id);

        return (
          <button
            key={course.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(String(course.id))}
            className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
              isSelected
                ? 'border-primary-500 bg-primary-600/10 ring-1 ring-primary-500/40'
                : 'border-dark-700 bg-dark-800/50 hover:border-dark-600 hover:bg-dark-800'
            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex-shrink-0 rounded-lg bg-dark-700 p-2">
                <BookOpen className="h-4 w-4 text-primary-400" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-dark-100">{course.title}</p>
                {course.description?.trim() && (
                  <p className="truncate text-xs text-dark-400">{course.description}</p>
                )}
              </div>
            </div>
            <ChevronRight
              className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-primary-400' : 'text-dark-500'}`}
            />
          </button>
        );
      })}
    </div>
  );
}
