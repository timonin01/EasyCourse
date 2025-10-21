package org.core.rest.stepik;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.dto.LessonCaptchaChallenge;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.stepik.lesson.StepikLessonResponseData;
import org.core.service.crud.LessonService;
import org.core.service.stepik.lesson.StepikLessonSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stepik/lessons")
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@CrossOrigin(origins = "*")
public class StepikLessonController {

    private final StepikLessonSyncService stepikLessonSyncService;
    private final LessonService lessonService;
    private final UserContextBean userContextBean;

    @GetMapping("/unsynced-lessons/{modelId}")
    public List<LessonResponseDTO> getUnsyncedLessonsByModelId(
            @PathVariable Long modelId,
            @RequestHeader("User-Id") Long userId) {
        log.info("Getting unsynced lessons for model: {}", modelId);
        userContextBean.setUserId(userId);
        return lessonService.getUnsyncedLessonsByModelId(modelId);
    }

    @PostMapping("/sync-lesson")
    public ResponseEntity<LessonCaptchaChallenge> syncLesson(
            @RequestParam Long lessonId,
            @RequestParam(required = false) String captchaToken,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting sync for lesson: {} with captcha: {}", lessonId, captchaToken != null);
            userContextBean.setUserId(userId);
            LessonCaptchaChallenge result = stepikLessonSyncService.syncLessonWithStepik(lessonId, captchaToken);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            log.warn("Sync failed for lesson {}: {}", lessonId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to sync lesson {} with Stepik: {}", lessonId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update-lesson/{lessonId}")
    public ResponseEntity<StepikLessonResponseData> updateLesson(
            @PathVariable Long lessonId,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting manual update of lesson: {}", lessonId);
            userContextBean.setUserId(userId);
            StepikLessonResponseData responseData = stepikLessonSyncService.updateLessonInStepik(lessonId);
            return ResponseEntity.ok(responseData);
        } catch (IllegalStateException e) {
            log.warn("Update failed for lesson {}: {}", lessonId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to update lesson {} in Stepik: {}", lessonId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/delete-lesson/{lessonId}")
    public ResponseEntity<Void> deleteLesson(
            @PathVariable Long lessonId,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting deletion of lesson: {}", lessonId);
            userContextBean.setUserId(userId);
            stepikLessonSyncService.deleteLessonFromStepik(lessonId);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            log.warn("Deletion failed for lesson {}: {}", lessonId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to delete lesson {} from Stepik: {}", lessonId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/sync-section-lessons")
    public ResponseEntity<List<LessonResponseDTO>> syncAllSectionLessonsFromStepik(
            @RequestParam Long modelId,
            @RequestHeader("User-Id") Long userId) {
        log.info("Syncing all lessons for model {} from Stepik", modelId);
        userContextBean.setUserId(userId);
        List<LessonResponseDTO> lessons = stepikLessonSyncService.syncAllSectionLessonsFromStepik(modelId);
        return ResponseEntity.ok(lessons);
    }
}
