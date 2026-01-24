package org.core.service.stepik;

import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.CourseCaptchaChallenge;
import org.core.dto.LessonCaptchaChallenge;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.repository.CourseRepository;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.core.service.stepik.course.StepikCourseSyncService;
import org.core.service.stepik.lesson.StepikLessonSyncService;
import org.core.service.stepik.section.StepikSectionSyncService;
import org.core.service.stepik.step.StepikStepSyncService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;

@Service
@RequiredArgsConstructor
@Slf4j
public class StepikCascadeSyncService {

    @Resource(name = "virtualExecutor")
    private final ExecutorService virtualExecutor;

    private final StepikCourseSyncService courseSyncService;
    private final StepikSectionSyncService sectionSyncService;
    private final StepikLessonSyncService lessonSyncService;
    private final StepikStepSyncService stepSyncService;

    private final CourseRepository courseRepository;
    private final UserContextBean userContextBean;

    private final LessonRepository lessonRepository;
    private final SectionRepository sectionRepository;

    public CourseCaptchaChallenge syncFullCourseForStepik(Long courseId, String captchaToken, Long userId){
        CourseCaptchaChallenge result = courseSyncService.syncCourseWithStepik(courseId, captchaToken);

        Optional<Course> course = courseRepository.findById(courseId);
        if(course.isEmpty()){
            log.error("Course with course id: {} not found", courseId);
            throw new IllegalArgumentException("Course with course id" + courseId + "not found");
        }
        List<Section> courseSections = course.get().getSections();

        List<CompletableFuture<Void>> sectionFutures = new ArrayList<>();
        for (Section section : courseSections) {
            sectionFutures.add(CompletableFuture.runAsync(() -> {
                        try {
                            userContextBean.setUserId(userId);
                            if (section.getStepikSectionId() == null) {
                                log.info("Start sync section with sectionId: {}", section.getId());
                                sectionSyncService.syncSectionWithStepik(section.getId());
                            } else {
                                log.info("Start update section in stepik with sectionId: {}", section.getId());
                                sectionSyncService.updateSectionInStepik(section.getId());
                            }
                        } finally {
                            userContextBean.clear();
                        }
                    })
                    .thenCompose(s -> syncAllLessons(section.getLessons(), captchaToken, userId)));
        }
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(sectionFutures.toArray(new CompletableFuture[0]));
        allFutures.join();

        return result;
    }

    private CompletableFuture<Void> syncAllLessons(List<Lesson> sectionLessons, String captchaToken, Long userId){
        List<CompletableFuture<Void>> lessonFutures = new ArrayList<>();
        for(Lesson lesson : sectionLessons){
            lessonFutures.add(CompletableFuture.runAsync(() -> {
                try {
                    userContextBean.setUserId(userId);
                    if(lesson.getStepikLessonId() == null) {
                        log.info("Start sync lesson with sectionId: {}", lesson.getId());
                        lessonSyncService.syncLessonWithStepik(lesson.getId(), captchaToken);
                    }else {
                        log.info("Start update lesson in stepik with sectionId: {}", lesson.getId());
                        lessonSyncService.updateLessonInStepik(lesson.getId());
                    }
                } finally {
                    userContextBean.clear();
                }
            }, virtualExecutor)
                    .thenCompose(a -> syncAllSteps(lesson.getSteps(), userId)));
        }

        return CompletableFuture.allOf(lessonFutures.toArray(new CompletableFuture[0]));
    }

    private CompletableFuture<Void> syncAllSteps(List<Step> lessonSteps, Long userId) {
        List<CompletableFuture<Void>> stepFutures = new ArrayList<>();
        for(Step step : lessonSteps){
            stepFutures.add(CompletableFuture.runAsync(() -> {
                try {
                    userContextBean.setUserId(userId);
                    if(step.getStepikStepId() == null) {
                        log.info("Start sync step with sectionId: {}", step.getId());
                        stepSyncService.syncStepWithStepik(step.getId());
                    }else{
                        log.info("Start update step in stepik with sectionId: {}", step.getId());
                        stepSyncService.updateStepInStepik(step.getId());
                    }
                } finally {
                    userContextBean.clear();
                }
            }, virtualExecutor));
        }
        return CompletableFuture.allOf(stepFutures.toArray(new CompletableFuture[0]));
    }

    public StepikSectionResponseData syncFullSectionById(Long sectionId, String captchaToken, Long userId){
        userContextBean.setUserId(userId);
        try{
            Section section = sectionRepository.findById(sectionId)
                    .orElseThrow(() -> new IllegalArgumentException("Section with id " + sectionId + " not found"));

            StepikSectionResponseData sectionResponseData;
            if (section.getStepikSectionId() == null) {
                log.info("Start sync section with sectionId: {}", section.getId());
                sectionResponseData = sectionSyncService.syncSectionWithStepik(section.getId());
            } else {
                log.info("Start update section in stepik with sectionId: {}", section.getId());
                sectionResponseData = sectionSyncService.updateSectionInStepik(section.getId());
            }

            syncAllLessons(section.getLessons(), captchaToken, userId)
                    .exceptionally(ex -> {
                        log.error("Error during lesson sync for section {}: {}", sectionId, ex.getMessage(), ex);
                        return null;
                    })
                    .join();
            return sectionResponseData;
        }finally {
            userContextBean.clear();
        }
    }

    public LessonCaptchaChallenge syncFullLessonById(Long lessonId, String captchaToken, Long userId){
        userContextBean.setUserId(userId);
        try{
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new IllegalArgumentException("Lesson with id " + lessonId + " not found"));

            LessonCaptchaChallenge lessonCaptchaChallenge;
            if(lesson.getStepikLessonId() == null) {
                log.info("Start sync lesson with sectionId: {}", lesson.getId());
                lessonCaptchaChallenge = lessonSyncService.syncLessonWithStepik(lesson.getId(), captchaToken);
            }else {
                log.info("Start update lesson in stepik with sectionId: {}", lesson.getId());
                lessonSyncService.updateLessonInStepik(lesson.getId());

                lessonCaptchaChallenge = LessonCaptchaChallenge.noCaptchaNeeded(lessonId);
                lessonCaptchaChallenge.setCaptchaKey(lesson.getStepikLessonId().toString());
                lessonCaptchaChallenge.setMessage("Lesson is already synced with Stepik (ID: " + lesson.getStepikLessonId() + ")");
            }

            syncAllSteps(lesson.getSteps(), userId)
                    .exceptionally(ex -> {
                        log.error("Error during step sync for lesson {}: {}", lessonId, ex.getMessage(), ex);
                        return null;
                    })
                    .join();
            return lessonCaptchaChallenge;
        }finally {
            userContextBean.clear();
        }
    }

}
