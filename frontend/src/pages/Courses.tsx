import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { MainLayout } from '../components/Layout';
import { VideoStepsWarningBanner } from '../components/VideoStepsWarningBanner';
import { Button, Input, Modal, Textarea, Badge, PageHeader, EmptyState, CoursesPageSkeleton, StaggerList, StaggerItem, ContentReveal } from '../components/ui';
import { CourseCard } from '../components/courses/CourseCard';
import { coursesApi, sectionsApi } from '../api';
import { useAuthStore, useCourseStore } from '../store';
import type { Course } from '../types';
import { extractApiErrorMessage } from '../utils/apiError';
import { validateTitle } from '../utils/validation';
import { getCoursesSubtitle } from '../utils/pageCopy';

export function Courses() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { courses, setCourses, addCourse, removeCourse, updateCourse, setSelectedCourse: selectCourseInStore } = useCourseStore();
  const [isLoading, setIsLoading] = useState(courses.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return;
      try {
        const data = await coursesApi.getUserCourses(user.id);
        setCourses(data);
      } catch (error) {
        toast.error('Не удалось загрузить курсы');
        console.error('Failed to load courses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, [user?.id, setCourses]);

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCourse = async () => {
    if (!user?.id) return;

    const titleError = validateTitle(formData.title, 'Название курса');
    if (titleError) {
      toast.error(titleError);
      return;
    }

    setIsSaving(true);

    try {
      const newCourse = await coursesApi.createCourse({
        title: formData.title.trim(),
        description: formData.description,
      });
      addCourse(newCourse);
      toast.success('Курс создан!');
      setIsCreateModalOpen(false);
      setFormData({ title: '', description: '' });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось создать курс'));
      console.error('Failed to create course:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return;

    const titleError = validateTitle(formData.title, 'Название курса');
    if (titleError) {
      toast.error(titleError);
      return;
    }

    setIsSaving(true);

    try {
      const updated = await coursesApi.updateCourse({
        id: selectedCourse.id,
        title: formData.title.trim(),
        description: formData.description,
      });
      updateCourse(updated);
      toast.success('Курс обновлен!');
      setIsEditModalOpen(false);
      setSelectedCourse(null);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось обновить курс'));
      console.error('Failed to update course:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот курс?')) return;

    try {
      await coursesApi.deleteCourse(courseId);
      removeCourse(courseId);
      toast.success('Курс удален!');
    } catch (error) {
      toast.error('Не удалось удалить курс');
      console.error('Failed to delete course:', error);
    }
  };

  const handleSyncCourse = async (courseId: number) => {
    try {
      toast.loading('Синхронизация...', { id: 'sync' });
      await coursesApi.syncCourse(courseId);
      const updatedCourse = await coursesApi.getCourse(courseId);
      updateCourse(updatedCourse);
      toast.success('Курс синхронизирован с Stepik!', { id: 'sync' });
    } catch (error) {
      toast.error('Ошибка синхронизации', { id: 'sync' });
      console.error('Failed to sync course:', error);
    }
  };

  const openCourseEditor = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      selectCourseInStore(course);
    }
    void sectionsApi.getCourseSections(courseId).then((sections) => {
      const state = useCourseStore.getState();
      if (state.selectedCourse?.id === courseId) {
        state.setModels(sections);
        state.saveSyncedModelPositions(sections);
      }
    }).catch(() => {
      // loadCourse в редакторе повторит запрос
    });
    navigate(`/courses/${courseId}`);
  };

  const openEditModal = (course: Course) => {
    setSelectedCourse(course);
    setFormData({ title: course.title, description: course.description });
    setIsEditModalOpen(true);
  };

  return (
    <MainLayout>
      <ContentReveal
        isLoading={isLoading && courses.length === 0}
        skeleton={<CoursesPageSkeleton />}
      >
      <PageHeader
        eyebrow="Библиотека"
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            Мои курсы
            {courses.length > 0 && (
              <Badge variant="default" className="align-middle text-xs font-medium">
                {courses.length}
              </Badge>
            )}
          </span>
        }
        description={getCoursesSubtitle(
          courses.length,
          filteredCourses.length,
          courses.filter((c) => c.fullySynced).length,
          searchQuery.trim().length > 0
        )}
        icon={<BookOpen className="h-5 w-5" />}
        iconAccent="blue"
        action={
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Создать курс
          </Button>
        }
      />

      <VideoStepsWarningBanner className="mb-6" />

      {/* Search */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <Input
            placeholder="Поиск курсов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={searchQuery ? 'Курсы не найдены' : 'У вас пока нет курсов'}
          description={searchQuery ? 'Попробуйте изменить запрос' : 'Создайте свой первый курс'}
          action={
            !searchQuery ? (
              <Button
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Создать курс
              </Button>
            ) : undefined
          }
        />
      ) : (
        <StaggerList className="grid grid-cols-1 gap-6 overflow-visible sm:grid-cols-2 2xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <StaggerItem key={course.id} className="h-full overflow-visible">
            <CourseCard
              course={course}
              variant="detailed"
              onOpen={openCourseEditor}
              onEdit={openEditModal}
              onSync={handleSyncCourse}
              onDelete={handleDeleteCourse}
            />
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создать курс"
      >
        <div className="space-y-4">
          <Input
            label="Название курса"
            placeholder="Введите название"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Textarea
            label="Описание"
            placeholder="Опишите курс"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateCourse} isLoading={isSaving}>
              Создать
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Редактировать курс"
      >
        <div className="space-y-4">
          <Input
            label="Название курса"
            placeholder="Введите название"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Textarea
            label="Описание"
            placeholder="Опишите курс"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateCourse} isLoading={isSaving}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
      </ContentReveal>
    </MainLayout>
  );
}

