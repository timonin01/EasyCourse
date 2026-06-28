export function pluralRu(
  count: number,
  one: string,
  few: string,
  many: string
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function formatCourseCount(count: number): string {
  return `${count} ${pluralRu(count, 'курс', 'курса', 'курсов')}`;
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 18) return 'Добрый день';
  if (hour >= 18 && hour < 23) return 'Добрый вечер';
  return 'Доброй ночи';
}

export function getDashboardSubtitle(courseCount: number, unsyncedCount: number): string {
  if (courseCount === 0) {
    return 'Создайте первый курс — дальше поможем с модулями, уроками и выгрузкой на Stepik';
  }
  if (unsyncedCount === 0) {
    return `Все ${formatCourseCount(courseCount)} синхронизированы с Stepik`;
  }
  if (unsyncedCount === courseCount) {
    return `${formatCourseCount(courseCount)} ещё не на Stepik — начните с Stepik Sync`;
  }
  return `${formatCourseCount(courseCount)} · ${unsyncedCount} ${pluralRu(unsyncedCount, 'ждёт', 'ждут', 'ждут')} синхронизации`;
}

export function getCoursesSubtitle(
  total: number,
  filtered: number,
  synced: number,
  hasSearch: boolean
): string {
  if (total === 0) {
    return 'Здесь будет ваша библиотека курсов для Stepik';
  }
  if (hasSearch && filtered !== total) {
    return `Найдено ${filtered} из ${total}`;
  }
  if (synced === total) {
    return `${formatCourseCount(total)} · всё на Stepik`;
  }
  if (synced === 0) {
    return `${formatCourseCount(total)} · пока только локально`;
  }
  return `${formatCourseCount(total)} · ${synced} на Stepik`;
}
