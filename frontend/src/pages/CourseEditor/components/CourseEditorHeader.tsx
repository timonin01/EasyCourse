import { ArrowLeft, Sparkles, RefreshCw, Trash2, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Badge } from '../../../components/ui';
import { coursesApi, sectionsApi } from '../../../api';
import type { Course, Model } from '../../../types';

interface CourseEditorHeaderProps {
  course: Course | null;
  hasUnsyncedContent: boolean;
  needsRefresh: boolean;
  courseId: string | undefined;
  onRefreshComplete: () => void;
  onDeleteClick: () => void;
  setSelectedCourse: (course: Course) => void;
  setModels: (sections: Model[]) => void;
}

export function CourseEditorHeader({
  course,
  hasUnsyncedContent,
  needsRefresh,
  courseId,
  onRefreshComplete,
  onDeleteClick,
  setSelectedCourse,
  setModels,
}: CourseEditorHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-dark-100">{course?.title}</h1>
          {course?.stepikCourseId ? (
            <a
              href={`https://stepik.org/course/${course.stepikCourseId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Badge variant="success" className="flex items-center gap-1 cursor-pointer hover:bg-green-500/30">
                <CheckCircle className="w-3 h-3" />
                Stepik #{course.stepikCourseId}
                <ExternalLink className="w-3 h-3" />
              </Badge>
            </a>
          ) : (
            <Badge variant="warning" className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Не синхронизирован
            </Badge>
          )}
          {hasUnsyncedContent && (
            <span title="Есть шаги или изменения, не выгруженные на Stepik">
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Есть несинхронизированные изменения
              </Badge>
            </span>
          )}
        </div>
        <p className="text-dark-400 text-sm">{course?.description}</p>
      </div>
      <Button
        variant="secondary"
        icon={<Sparkles className="w-4 h-4" />}
        onClick={() => navigate('/ai-generator')}
      >
        AI Генератор
      </Button>
      {needsRefresh && (
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={async () => {
            if (!courseId) return;
            try {
              const refreshed = await coursesApi.getCourse(parseInt(courseId));
              setSelectedCourse(refreshed);
              const courseSections = await sectionsApi.getCourseSections(parseInt(courseId));
              setModels(courseSections);
              onRefreshComplete();
              toast.success('Данные обновлены');
            } catch {
              toast.error('Ошибка обновления данных');
            }
          }}
          title="Обновить данные"
        >
          Обновить
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-red-400 hover:text-red-300"
        onClick={onDeleteClick}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
