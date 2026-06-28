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
import { DashboardSubscriptionWidget } from '../components/subscription/DashboardSubscriptionWidget';
import { Card, Button, StatCard, EmptyState, DashboardSkeleton, StaggerList, StaggerItem, ContentReveal, PageHeader, Badge } from '../components/ui';
import { CourseCard } from '../components/courses/CourseCard';
import { coursesApi } from '../api';
import { useAuthStore, useCourseStore } from '../store';
import { formatCourseCount, getDashboardSubtitle, getTimeGreeting } from '../utils/pageCopy';

export function Dashboard() {
  const { user } = useAuthStore();
  const { setCourses, courses } = useCourseStore();
  const [isLoading, setIsLoading] = useState(courses.length === 0);

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
    { label: 'Всего курсов', value: courses.length, icon: BookOpen, accent: 'primary' as const },
    { label: 'Синхронизировано', value: courses.filter(c => c.fullySynced).length, icon: TrendingUp, accent: 'blue' as const },
    { label: 'Не синхронизировано', value: courses.filter(c => !c.fullySynced).length, icon: FileText, accent: 'amber' as const },
  ];

  const recentCourses = [...courses]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const isNewUser = courses.length === 0;
  const unsyncedCount = courses.filter((c) => !c.fullySynced).length;
  const syncedCount = courses.length - unsyncedCount;
  const firstName = user?.name?.split(/\s+/)[0];

  return (
    <MainLayout>
      <ContentReveal
        isLoading={isLoading && courses.length === 0}
        skeleton={<DashboardSkeleton />}
      >
        <PageHeader
          size="hero"
          eyebrow={getTimeGreeting()}
          title={
            firstName ? (
              <>
                <span className="text-dark-100">{firstName}</span>
                <span className="text-dark-500">, рад вас видеть</span>
              </>
            ) : (
              'Дашборд'
            )
          }
          description={getDashboardSubtitle(courses.length, unsyncedCount)}
          meta={
            !isNewUser ? (
              <>
                <Badge variant="default">{formatCourseCount(courses.length)}</Badge>
                {syncedCount > 0 && (
                  <Badge variant="success">{syncedCount} на Stepik</Badge>
                )}
                {unsyncedCount > 0 && (
                  <Badge variant="warning">{unsyncedCount} не синхр.</Badge>
                )}
              </>
            ) : undefined
          }
        />

        {isNewUser && <OnboardingBanner />}

        <DashboardSubscriptionWidget />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              accent={stat.accent}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link to="/courses">
            <Card hover className="h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-primary-600/20 p-4">
                    <Plus className="h-8 w-8 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark-100">Создать курс</h3>
                    <p className="text-dark-400">Новый курс с нуля</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-dark-500" />
              </div>
            </Card>
          </Link>

          <Link to="/ai-generator">
            <Card hover className="h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-purple-600/20 p-4">
                    <Sparkles className="h-8 w-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark-100">AI Генератор</h3>
                    <p className="text-dark-400">Генерация шагов и заданий</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-dark-500" />
              </div>
            </Card>
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-heading">Последние курсы</h2>
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
            <EmptyState
              variant="dashed"
              icon={BookOpen}
              title="Пока нет курсов"
              description="Здесь появятся ваши курсы после создания"
              action={
                <Link to="/courses">
                  <Button icon={<Plus className="w-4 h-4" />}>Создать первый курс</Button>
                </Link>
              }
            />
          ) : (
            <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentCourses.map((course) => (
                <StaggerItem key={course.id}>
                  <CourseCard course={course} variant="compact" />
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </div>
      </ContentReveal>
    </MainLayout>
  );
}
