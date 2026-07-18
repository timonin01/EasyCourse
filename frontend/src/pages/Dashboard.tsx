import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, ArrowRight, RefreshCw } from 'lucide-react';
import { MainLayout } from '../components/Layout';
import { OnboardingBanner } from '../components/auth/OnboardingBanner';
import { CourseAgentPromoCard } from '../components/dashboard/CourseAgentPromoCard';
import { DashboardSubscriptionWidget } from '../components/subscription/DashboardSubscriptionWidget';
import {
  Button,
  EmptyState,
  DashboardSkeleton,
  StaggerList,
  StaggerItem,
  ContentReveal,
  PageHeader,
} from '../components/ui';
import { CourseCard } from '../components/courses/CourseCard';
import { coursesApi } from '../api';
import { useAuthStore, useCourseStore } from '../store';
import { getTimeGreeting, pluralRu } from '../utils/pageCopy';

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
    void loadCourses();
  }, [user?.id, setCourses]);

  const recentCourses = [...courses]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const isNewUser = courses.length === 0;
  const unsyncedCount = courses.filter((c) => !c.fullySynced).length;
  const firstName = user?.name?.split(/\s+/)[0];

  return (
    <MainLayout>
      <ContentReveal
        isLoading={isLoading && courses.length === 0}
        skeleton={<DashboardSkeleton />}
      >
        <PageHeader
          eyebrow={getTimeGreeting()}
          title={firstName ? `${firstName}, рад вас видеть` : 'Дашборд'}
          className="mb-6"
        />

        {isNewUser && <OnboardingBanner />}

        <DashboardSubscriptionWidget />

        <CourseAgentPromoCard className="mb-6" hasCourses={!isNewUser} />

        {!isNewUser && unsyncedCount > 0 && (
          <Link
            to="/stepik-sync"
            className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 transition-colors hover:border-amber-500/40 hover:bg-amber-500/10"
          >
            <div className="flex min-w-0 items-center gap-2.5 text-sm text-amber-100/90">
              <RefreshCw className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                {unsyncedCount}{' '}
                {pluralRu(unsyncedCount, 'курс ждёт', 'курса ждут', 'курсов ждут')} синхронизации
                со Stepik
              </span>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-amber-300">
              Stepik Sync
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        )}

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-heading">Последние курсы</h2>
            <div className="flex items-center gap-2">
              {!isNewUser && (
                <Link to="/courses">
                  <Button variant="ghost" size="sm">
                    Все курсы
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link to="/courses">
                <Button size="sm" icon={<Plus className="h-4 w-4" />}>
                  {isNewUser ? 'Создать курс' : 'Создать'}
                </Button>
              </Link>
            </div>
          </div>

          {isNewUser ? (
            <EmptyState
              variant="dashed"
              icon={BookOpen}
              title="Пока нет курсов"
              description="Создайте курс или откройте AI-агента — он поможет собрать структуру"
              action={
                <Link to="/courses">
                  <Button icon={<Plus className="h-4 w-4" />}>Создать первый курс</Button>
                </Link>
              }
            />
          ) : (
            <StaggerList className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentCourses.map((course) => (
                <StaggerItem key={course.id} className="h-full overflow-visible">
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
