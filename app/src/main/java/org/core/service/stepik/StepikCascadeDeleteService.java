package org.core.service.stepik;

import jakarta.annotation.Resource;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Model;
import org.core.domain.Step;
import org.core.repository.CourseRepository;
import org.core.repository.LessonRepository;
import org.core.repository.ModelRepository;
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
@Transactional
public class StepikCascadeDeleteService {

    @Resource(name = "virtualExecutor")
    private final ExecutorService virtualExecutor;

    private final StepikCourseSyncService courseSyncService;
    private final StepikSectionSyncService sectionSyncService;
    private final StepikLessonSyncService lessonSyncService;
    private final StepikStepSyncService stepSyncService;

    private final UserContextBean userContextBean;
    
    private final CourseRepository courseRepository;
    private final ModelRepository modelRepository;
    private final LessonRepository lessonRepository;

    public void deleteFullCourseFromStepik(Long courseId, Long userId){
        userContextBean.setUserId(userId);
        try {
            Optional<Course> course = courseRepository.findById(courseId);
            if (course.isEmpty()) {
                log.error("Course with id: {} not found", courseId);
                throw new IllegalArgumentException("Course with id " + courseId + " not found");
            }
            if (course.get().getStepikCourseId() == null) {
                log.error("Course with id: {} not synchronized with stepik", courseId);
                throw new IllegalArgumentException("Course with id " + courseId + " not synchronized with stepik");
            }

            List<CompletableFuture<Void>> sectionFutures = new ArrayList<>();
            List<Model> courseModels = course.get().getModels();
            for (Model section : courseModels) {
                if (section.getStepikSectionId() != null) {
                    log.info("Start async deleting section from stepik with sectionId: {}", section.getId());
                    sectionFutures.add(CompletableFuture.runAsync(() -> {
                        userContextBean.setUserId(userId);
                        try {
                            deleteFullSectionFromStepik(section, userId).join();
                        } finally {
                            userContextBean.clear();
                        }
                    }, virtualExecutor));
                } else {
                    log.error("Section {} is not synchronized with stepik, skipping", section.getId());
                }
            }

            CompletableFuture<Void> allFutures = CompletableFuture.allOf(sectionFutures.toArray(new CompletableFuture[0]))
                    .exceptionally(ex -> {
                        log.error("Error during section deletion for course {}: {}", courseId, ex.getMessage(), ex);
                        return null;
                    });
            allFutures.join();

            courseSyncService.deleteCourseFromStepik(courseId);
            log.info("Course {} cascade deletion success", courseId);
        } finally {
            userContextBean.clear();
        }
    }

    public CompletableFuture<Void> deleteFullSectionFromStepik(Model section, Long userId) {
        if(section.getStepikSectionId() == null){
            log.error("Section with id: {} not synchronized with stepik", section.getId());
            return CompletableFuture.completedFuture(null);
        }

        List<CompletableFuture<Void>> lessonFutures = new ArrayList<>();
        List<Lesson> sectionLessons = section.getLessons();
        for(Lesson lesson : sectionLessons){
            if (lesson.getStepikLessonId() != null) {
                log.info("Start async deleting lesson from stepik with lessonId: {}", lesson.getId());
                lessonFutures.add(CompletableFuture.runAsync(() -> {
                    userContextBean.setUserId(userId);
                    try {
                        deleteFullLessonFromStepik(lesson, userId).join();
                    } finally {
                        userContextBean.clear();
                    }
                }, virtualExecutor));
            } else {
                log.error("Lesson {} is not synchronized with stepik, skipping", lesson.getId());
            }
        }

        return CompletableFuture.allOf(lessonFutures.toArray(new CompletableFuture[0]))
                .exceptionally(ex -> {
                    log.error("Error during lesson deletion for section {}: {}", section.getId(), ex.getMessage(), ex);
                    return null;
                })
                .thenRun(() -> {
                    userContextBean.setUserId(userId);
                    try {
                        sectionSyncService.deleteModelFromStepik(section.getId());
                        log.info("Section {} cascade deletion success", section.getId());
                    } finally {
                        userContextBean.clear();
                    }
                });
    }

    public CompletableFuture<Void> deleteFullLessonFromStepik(Lesson lesson, Long userId) {
        if(lesson.getStepikLessonId() == null){
            log.error("Lesson with id: {} not synchronized with stepik", lesson.getId());
            return CompletableFuture.completedFuture(null);
        }

        List<CompletableFuture<Void>> stepFutures = new ArrayList<>();
        List<Step> lessonSteps = lesson.getSteps();
        for(Step step : lessonSteps){
            if(step.getStepikStepId() != null){
                log.info("Start async deleting step from stepik with stepId: {}", step.getId());
                stepFutures.add(CompletableFuture.runAsync(() -> {
                    userContextBean.setUserId(userId);
                    try {
                        stepSyncService.deleteStepFromStepik(step.getId());
                    } catch (RuntimeException e) {
                        log.error("Failed to delete step {} from Stepik: {}", step.getId(), e.getMessage());
                    } finally {
                        userContextBean.clear();
                    }
                }, virtualExecutor));
            }
        }

        return CompletableFuture.allOf(stepFutures.toArray(new CompletableFuture[0]))
                .exceptionally(ex -> {
                    log.error("Error during step deletion for lesson {}: {}", lesson.getId(), ex.getMessage(), ex);
                    return null;
                })
                .thenRun(() -> {
                    userContextBean.setUserId(userId);
                    try {
                        lessonSyncService.deleteLessonFromStepik(lesson.getId());
                        log.info("Lesson {} cascade deletion success", lesson.getId());
                    } finally {
                        userContextBean.clear();
                    }
                });
    }

    public void deleteFullSectionFromStepikById(Long modelId, Long userId) {
        userContextBean.setUserId(userId);
        try {
            Model model = modelRepository.findById(modelId)
                    .orElseThrow(() -> new IllegalArgumentException("Model with id " + modelId + " not found"));
            deleteFullSectionFromStepik(model, userId).join();
        } finally {
            userContextBean.clear();
        }
    }

    public void deleteFullLessonFromStepikById(Long lessonId, Long userId) {
        userContextBean.setUserId(userId);
        try {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new IllegalArgumentException("Lesson with id " + lessonId + " not found"));
            deleteFullLessonFromStepik(lesson, userId).join();
        } finally {
            userContextBean.clear();
        }
    }
}
