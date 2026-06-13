import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { MainLayout } from '../components/Layout';
import { OnboardingBanner } from '../components/auth/OnboardingBanner';
import { Card, Button, PageLoader } from '../components/ui';
import { coursesApi } from '../api';
import { useAuthStore, useCourseStore } from '../store';
import type { Course } from '../types';

export function Dashboard() {
  const { user } = useAuthStore();
  const { setCourses, courses } = useCourseStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return;
      try {
        const data = await coursesApi.getUserCourses(user.id);
        setCourses(data);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, [user?.id, setCourses]);

  const stats = [
    { label: 'Всего курсов', value: courses.length, icon: BookOpen, color: 'text-primary-400' },
    { label: 'Синхронизировано', value: courses.filter(c => c.stepikCourseId).length, icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Черновики', value: courses.filter(c => !c.stepikCourseId).length, icon: FileText, color: 'text-amber-400' },
  ];

  const isNewUser = courses.length === 0;

  if (isLoading) {
    return (
      <MainLayout>
        <PageLoader />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-100">
          Привет, <span className="gradient-text">{user?.name || 'Пользователь'}</span>! 👋
        </h1>
        <p className="text-dark-400 mt-2">
          {isNewUser
            ? 'Начните создавать курсы для Stepik — мы подскажем, с чего начать'
            : 'Вот что происходит с вашими курсами сегодня'}
        </p>
      </div>

      {isNewUser && <OnboardingBanner />}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-dark-800 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-100">{stat.value}</p>
              <p className="text-sm text-dark-400">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/courses">
          <Card hover className="h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary-600/20 rounded-xl">
                  <Plus className="w-8 h-8 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-100">Создать курс</h3>
                  <p className="text-dark-400">Начните новый курс с нуля</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-dark-500" />
            </div>
          </Card>
        </Link>

        <Link to="/ai-generator">
          <Card hover className="h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-600/20 rounded-xl">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-100">AI Генератор</h3>
                  <p className="text-dark-400">Создавайте контент с помощью ИИ</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-dark-500" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark-100">Последние курсы</h2>
          {!isNewUser && (
            <Link to="/courses">
              <Button variant="ghost" size="sm">
                Все курсы
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>

        {isNewUser ? (
          <Card className="text-center py-8 border-dashed border-dark-600">
            <BookOpen className="w-10 h-10 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">Здесь появятся ваши курсы после создания</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link to={`/courses/${course.id}`}>
      <Card hover className="h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 bg-primary-600/20 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary-400" />
          </div>
          {course.stepikCourseId && (
            <span className="px-2 py-1 bg-primary-900/50 text-primary-400 text-xs rounded-full">
              Stepik
            </span>
          )}
        </div>
        <h3 className="font-semibold text-dark-100 mb-1 line-clamp-1">{course.title}</h3>
        <p className="text-sm text-dark-400 line-clamp-2">{course.description}</p>
        <p className="text-xs text-dark-500 mt-3">
          Обновлено: {new Date(course.updatedAt).toLocaleDateString('ru-RU')}
        </p>
      </Card>
    </Link>
  );
}

