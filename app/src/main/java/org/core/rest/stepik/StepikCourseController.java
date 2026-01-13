package org.core.rest.stepik;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.dto.CourseCaptchaChallenge;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.stepik.FullCourseResponseDTO;
import org.core.dto.stepik.course.StepikCourseResponseData;
import org.core.service.crud.CourseService;
import org.core.service.stepik.StepikCascadeDeleteService;
import org.core.service.stepik.course.StepikCourseSyncService;

import java.util.List;

import org.core.service.stepik.course.SyncFullCourseForStepik;
import org.core.service.stepik.course.getCourseFromStepik.StepikFullCourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stepik")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class StepikCourseController {

    private final StepikCourseSyncService stepikCourseSyncService;
    private final StepikFullCourseService fullCourseService;
    private final CourseService courseService;
    private final UserContextBean userContextBean;

    private final StepikCascadeDeleteService cascadeDeleteService;
    private final SyncFullCourseForStepik syncFullCourseForStepik;

    @GetMapping("/unsynced-courses/{userId}")
    public List<CourseResponseDTO> getUnsyncedCoursesByUserId(@PathVariable Long userId) {
        log.info("Getting unsynced courses for user: {}", userId);
        userContextBean.setUserId(userId);
        return courseService.getUnsyncedCoursesByUserId(userId);
    }

    @PostMapping("/sync-course")
    public ResponseEntity<CourseCaptchaChallenge> syncCourse(
            @RequestParam Long courseId,
            @RequestParam(required = false) String captchaToken,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting sync for course: {} with captcha: {}", courseId, captchaToken != null);
            userContextBean.setUserId(userId);
            CourseCaptchaChallenge result = syncFullCourseForStepik.syncFullCourseForStepik(courseId, captchaToken, userId);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            log.warn("Sync failed for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to sync course {} with Stepik: {}", courseId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        } finally {
            userContextBean.clear();
        }
    }

    @PutMapping("/update-course/{courseId}")
    public ResponseEntity<StepikCourseResponseData> updateCourseInStepik(
            @PathVariable Long courseId,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting update for course: {}", courseId);
            userContextBean.setUserId(userId);
            StepikCourseResponseData responseData = stepikCourseSyncService.updateCourseInStepik(courseId);
            return ResponseEntity.ok(responseData);
        } catch (IllegalStateException e) {
            log.warn("Update failed for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to update course {} in Stepik: {}", courseId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/delete-course/{courseId}")
    public ResponseEntity<String> deleteCourseFromStepik(
            @PathVariable Long courseId,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting deletion for course: {}", courseId);
            userContextBean.setUserId(userId);
            cascadeDeleteService.deleteFullCourseFromStepik(courseId, userId);
            return ResponseEntity.ok("Course successfully deleted from Stepik");
        } catch (IllegalStateException e) {
            log.warn("Deletion failed for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Failed to delete course {} from Stepik: {}", courseId, e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to delete course from Stepik: " + e.getMessage());
        }
    }

    @GetMapping("/full-course-from-stepik/{stepikCourseId}")
    public ResponseEntity<FullCourseResponseDTO> getFullCourseFromStepik(
            @PathVariable Long stepikCourseId,
            @RequestHeader("User-Id") Long userId){
        try {
            log.info("Get full course: {}, for: {}", stepikCourseId, userId);
            userContextBean.setUserId(userId);

            return ResponseEntity.ok(fullCourseService.buildFullCourseResponseDTO(stepikCourseId, userId));
        }catch (RuntimeException e){
            log.error("Failed to getting full course from stepik to {}: {}", stepikCourseId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}