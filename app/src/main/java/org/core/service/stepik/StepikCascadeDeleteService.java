package org.core.service.stepik;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.core.util.UserAccessService;
import org.core.service.stepik.course.StepikCourseSyncService;
import org.core.service.stepik.lesson.StepikLessonSyncService;
import org.core.service.stepik.section.StepikSectionSyncService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StepikCascadeDeleteService {

    private final StepikCourseSyncService courseSyncService;
    private final StepikSectionSyncService sectionSyncService;
    private final StepikLessonSyncService lessonSyncService;

    private final UserContextBean userContextBean;
    private final UserAccessService userAccessService;

    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;

    public void deleteFullCourseFromStepik(Long courseId, Long userId) {
        runWithRestoredUserContext(userId, () -> {
            userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
            courseSyncService.deleteCourseFromStepik(courseId);
            log.info("Course {} deleted from Stepik", courseId);
        });
    }

    public void deleteFullSectionFromStepik(Section section, Long userId) {
        runWithRestoredUserContext(userId, () -> {
            sectionSyncService.deleteSectionFromStepik(section.getId());
            log.info("Section {} deleted from Stepik", section.getId());
        });
    }

    public void deleteFullLessonFromStepik(Lesson lesson, Long userId) {
        runWithRestoredUserContext(userId, () -> {
            lessonSyncService.deleteLessonFromStepik(lesson.getId());
            log.info("Lesson {} deleted from Stepik", lesson.getId());
        });
    }

    public void deleteFullSectionFromStepikById(Long sectionId, Long userId) {
        runWithRestoredUserContext(userId, () -> {
            Section section = sectionRepository.findById(sectionId)
                    .orElseThrow(() -> new IllegalArgumentException("Section with id " + sectionId + " not found"));
            deleteFullSectionFromStepik(section, userId);
        });
    }

    public void deleteFullLessonFromStepikById(Long lessonId, Long userId) {
        runWithRestoredUserContext(userId, () -> {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new IllegalArgumentException("Lesson with id " + lessonId + " not found"));
            deleteFullLessonFromStepik(lesson, userId);
        });
    }

    private void runWithRestoredUserContext(Long userId, Runnable action) {
        Long previousUserId = userContextBean.getUserId();
        userContextBean.setUserId(userId);
        try {
            action.run();
        } finally {
            restoreUserContext(previousUserId);
        }
    }

    private void restoreUserContext(Long previousUserId) {
        if (previousUserId != null) {
            userContextBean.setUserId(previousUserId);
        } else {
            userContextBean.clear();
        }
    }
}
