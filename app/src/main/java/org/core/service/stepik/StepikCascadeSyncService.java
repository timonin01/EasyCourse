package org.core.service.stepik;

import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.dto.CourseCaptchaChallenge;
import org.core.dto.LessonCaptchaChallenge;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.stepik.StepikSyncFailure;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.core.service.crud.CourseService;
import org.core.service.crud.LessonService;
import org.core.service.crud.SectionService;
import org.core.service.crud.StepService;
import org.core.service.stepik.course.StepikCourseSyncService;
import org.core.service.stepik.lesson.StepikLessonSyncService;
import org.core.service.stepik.section.StepikSectionSyncService;
import org.core.service.stepik.section.StepikSectionService;
import org.core.service.stepik.step.StepikStepSyncService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;

@Service
@RequiredArgsConstructor
@Slf4j
public class StepikCascadeSyncService {

    @Resource(name = "virtualExecutor")
    private final ExecutorService virtualExecutor;

    private final StepikCourseSyncService courseSyncService;
    private final StepikSectionSyncService sectionSyncService;
    private final StepikSectionService stepikSectionService;
    private final StepikLessonSyncService lessonSyncService;
    private final StepikStepSyncService stepSyncService;

    private final SectionService sectionService;
    private final LessonService lessonService;
    private final StepService stepService;
    private final CourseService courseService;
    private final UserContextBean userContextBean;
    private final StepikSyncFailureHelper failureHelper;

    private final LessonRepository lessonRepository;
    private final SectionRepository sectionRepository;

    public CourseCaptchaChallenge syncFullCourseForStepik(Long courseId, String captchaToken, Long userId) {
        Long effectiveUserId = requireUserId(userId);
        userContextBean.setUserId(effectiveUserId);
        return syncFullCourseForStepikInternal(courseId, captchaToken, effectiveUserId);
    }

    private CourseCaptchaChallenge syncFullCourseForStepikInternal(Long courseId, String captchaToken, Long userId) {
        CourseResponseDTO course = courseService.getCourseByCourseId(courseId);
        CourseCaptchaChallenge result;
        if (course.getStepikCourseId() == null) {
            result = courseSyncService.syncCourseWithStepik(courseId, captchaToken);
        } else if (course.isNeedsStepikSync()) {
            courseSyncService.updateCourseInStepik(courseId);
            result = CourseCaptchaChallenge.noCaptchaNeeded(courseId);
            result.setCaptchaKey(course.getStepikCourseId().toString());
            result.setMessage("Course updated in Stepik ID: " + course.getStepikCourseId());
        } else {
            result = courseSyncService.syncCourseWithStepik(courseId, captchaToken);
        }

        ConcurrentLinkedQueue<StepikSyncFailure> failures = new ConcurrentLinkedQueue<>();
        List<SectionResponseDTO> sections = sectionService.getCourseSectionsByCourseId(courseId);

        List<CompletableFuture<Void>> sectionFutures = new ArrayList<>();
        for (SectionResponseDTO section : sections) {
            sectionFutures.add(CompletableFuture.runAsync(
                    () -> syncMissingInSection(section.getId(), captchaToken, userId, failures),
                    virtualExecutor));
        }
        CompletableFuture.allOf(sectionFutures.toArray(new CompletableFuture[0])).join();

        List<StepikSyncFailure> failureList = new ArrayList<>(failures);
        if (result.getFailures() == null) {
            result.setFailures(new ArrayList<>());
        }
        result.getFailures().addAll(failureList);
        result.setMessage(failureHelper.buildSyncSummaryMessage(result.getMessage(), failureList));
        failureHelper.logFailures("Course", courseId, failureList);
        return result;
    }

    private Long requireUserId(Long userId) {
        if (userId != null) {
            return userId;
        }
        Long fromContext = userContextBean.getUserId();
        if (fromContext != null) {
            return fromContext;
        }
        throw new IllegalStateException("User is not authenticated");
    }

    private void syncMissingInSection(Long sectionId,
                                      String captchaToken,
                                      Long userId,
                                      ConcurrentLinkedQueue<StepikSyncFailure> failures) {
        userContextBean.setUserId(userId);
        try {
            SectionResponseDTO section = sectionService.getSectionBySectionId(sectionId);
            try {
                if (section.getStepikSectionId() == null) {
                    log.info("Start sync section with sectionId: {}", sectionId);
                    sectionSyncService.syncSectionWithStepik(sectionId);
                } else if (section.isNeedsStepikSync()) {
                    log.info("Start update section in stepik with sectionId: {}", sectionId);
                    sectionSyncService.updateSectionInStepik(sectionId);
                }
            } catch (Exception e) {
                log.error("Failed to sync section {}: {}", sectionId, e.getMessage());
                failures.add(StepikSyncFailure.of("section", sectionId, section.getTitle(), e));
                return;
            }

            List<LessonResponseDTO> lessons = lessonService.getSectionLessonsBySectionId(sectionId);
            for (LessonResponseDTO lesson : lessons) {
                try {
                    if (lesson.getStepikLessonId() == null) {
                        log.info("Start sync lesson with lessonId: {}", lesson.getId());
                        lessonSyncService.syncLessonWithStepik(lesson.getId(), captchaToken);
                    } else if (lesson.isNeedsStepikSync()) {
                        log.info("Start update lesson in stepik with lessonId: {}", lesson.getId());
                        lessonSyncService.updateLessonInStepik(lesson.getId());
                    }
                } catch (Exception e) {
                    log.error("Failed to sync lesson {}: {}", lesson.getId(), e.getMessage());
                    failures.add(StepikSyncFailure.of("lesson", lesson.getId(), lesson.getTitle(), e));
                    continue;
                }

                List<StepResponseDTO> steps = stepService.getLessonStepsByLessonId(lesson.getId());
                for (StepResponseDTO step : steps) {
                    try {
                        if (step.getStepikStepId() == null) {
                            log.info("Start sync step with stepId: {}", step.getId());
                            stepSyncService.syncStepWithStepik(step.getId());
                        } else if (step.isNeedsStepikSync()) {
                            log.info("Start update step in stepik with stepId: {}", step.getId());
                            stepSyncService.updateStepInStepik(step.getId());
                        }
                    } catch (Exception e) {
                        log.error("Failed to sync step {}: {}", step.getId(), e.getMessage());
                        failures.add(StepikSyncFailure.of(
                                "step",
                                step.getId(),
                                failureHelper.stepTitle(step),
                                e));
                    }
                }
            }
        } catch (Exception e) {
            log.error("Unexpected error while syncing section {}: {}", sectionId, e.getMessage());
            failures.add(StepikSyncFailure.of("section", sectionId, null, e));
        } finally {
            userContextBean.clear();
        }
    }

    public StepikSectionResponseData syncFullSectionById(Long sectionId, String captchaToken, Long userId) {
        userContextBean.setUserId(userId);
        ConcurrentLinkedQueue<StepikSyncFailure> failures = new ConcurrentLinkedQueue<>();
        try {
            Section section = sectionRepository.findById(sectionId)
                    .orElseThrow(() -> new IllegalArgumentException("Section with id " + sectionId + " not found"));

            StepikSectionResponseData sectionResponseData;
            try {
                if (section.getStepikSectionId() == null) {
                    log.info("Start sync section with sectionId: {}", section.getId());
                    sectionResponseData = sectionSyncService.syncSectionWithStepik(section.getId());
                } else if (section.isNeedsStepikSync()) {
                    log.info("Start update section in stepik with sectionId: {}", section.getId());
                    sectionResponseData = sectionSyncService.updateSectionInStepik(section.getId());
                } else {
                    sectionResponseData = stepikSectionService.getSectionByStepikId(section.getStepikSectionId());
                }
            } catch (Exception e) {
                log.error("Failed to sync section {}: {}", sectionId, e.getMessage());
                throw e;
            }

            syncMissingInSection(sectionId, captchaToken, userId, failures);
            failureHelper.logFailures("Section", sectionId, new ArrayList<>(failures));
            return sectionResponseData;
        } finally {
            userContextBean.clear();
        }
    }

    public LessonCaptchaChallenge syncFullLessonById(Long lessonId, String captchaToken, Long userId) {
        userContextBean.setUserId(userId);
        List<StepikSyncFailure> failures = new ArrayList<>();
        try {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new IllegalArgumentException("Lesson with id " + lessonId + " not found"));

            LessonCaptchaChallenge lessonCaptchaChallenge;
            if (lesson.getStepikLessonId() == null) {
                log.info("Start sync lesson with lessonId: {}", lesson.getId());
                lessonCaptchaChallenge = lessonSyncService.syncLessonWithStepik(lesson.getId(), captchaToken);
            } else if (lesson.isNeedsStepikSync()) {
                log.info("Start update lesson in stepik with lessonId: {}", lesson.getId());
                lessonSyncService.updateLessonInStepik(lesson.getId());
                lessonCaptchaChallenge = LessonCaptchaChallenge.noCaptchaNeeded(lessonId);
                lessonCaptchaChallenge.setCaptchaKey(lesson.getStepikLessonId().toString());
                lessonCaptchaChallenge.setMessage("Lesson updated in Stepik (ID: " + lesson.getStepikLessonId() + ")");
            } else {
                lessonCaptchaChallenge = LessonCaptchaChallenge.noCaptchaNeeded(lessonId);
                lessonCaptchaChallenge.setCaptchaKey(lesson.getStepikLessonId().toString());
                lessonCaptchaChallenge.setMessage("Lesson is already synced with Stepik (ID: " + lesson.getStepikLessonId() + ")");
            }

            List<StepResponseDTO> steps = stepService.getLessonStepsByLessonId(lessonId);
            for (StepResponseDTO step : steps) {
                try {
                    if (step.getStepikStepId() == null) {
                        log.info("Start sync step with stepId: {}", step.getId());
                        stepSyncService.syncStepWithStepik(step.getId());
                    } else if (step.isNeedsStepikSync()) {
                        log.info("Start update step in stepik with stepId: {}", step.getId());
                        stepSyncService.updateStepInStepik(step.getId());
                    }
                } catch (Exception e) {
                    log.error("Failed to sync step {}: {}", step.getId(), e.getMessage());
                    failures.add(StepikSyncFailure.of("step", step.getId(), failureHelper.stepTitle(step), e));
                }
            }
            if (lessonCaptchaChallenge.getFailures() == null) {
                lessonCaptchaChallenge.setFailures(new ArrayList<>());
            }
            lessonCaptchaChallenge.getFailures().addAll(failures);
            lessonCaptchaChallenge.setMessage(
                    failureHelper.buildSyncSummaryMessage(lessonCaptchaChallenge.getMessage(), failures));
            return lessonCaptchaChallenge;
        } finally {
            userContextBean.clear();
        }
    }
}
