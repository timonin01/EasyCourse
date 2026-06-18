import type { Course, Model, Lesson, Step } from '../types';

export function sectionNeedsUpload(section: Model): boolean {
  return !section.stepikSectionId || Boolean(section.needsStepikSync);
}

export function lessonNeedsUpload(lesson: Lesson): boolean {
  return !lesson.stepikLessonId || Boolean(lesson.needsStepikSync);
}

export function stepNeedsUpload(step: Step): boolean {
  return !step.stepikStepId || Boolean(step.needsStepikSync);
}

export function countPendingStepikUploads(details: {
  course?: Pick<Course, 'stepikCourseId' | 'needsStepikSync'>;
  sections?: Model[];
  lessons?: Lesson[];
  steps?: Step[];
}): number {
  if (!details.course?.stepikCourseId) {
    return 0;
  }

  let count = 0;
  if (details.course.needsStepikSync) {
    count += 1;
  }
  details.sections?.forEach((section) => {
    if (sectionNeedsUpload(section)) count += 1;
  });
  details.lessons?.forEach((lesson) => {
    if (lessonNeedsUpload(lesson)) count += 1;
  });
  details.steps?.forEach((step) => {
    if (stepNeedsUpload(step)) count += 1;
  });
  return count;
}

export function hasPendingStepikUploads(details: {
  course?: Pick<Course, 'stepikCourseId' | 'needsStepikSync'>;
  sections?: Model[];
  lessons?: Lesson[];
  steps?: Step[];
}): boolean {
  if (!details.course) {
    return false;
  }
  if (!details.course.stepikCourseId) {
    return true;
  }
  return countPendingStepikUploads(details) > 0;
}
