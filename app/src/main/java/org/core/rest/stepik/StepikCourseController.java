package org.core.rest.stepik;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.CaptchaChallenge;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.stepik.course.StepikCourseResponseData;
import org.core.service.crud.CourseService;
import org.core.service.stepik.course.StepikCourseSyncService;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stepik")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class StepikCourseController {

    private final StepikCourseSyncService stepikCourseSyncService;
    private final CourseService courseService;

    @GetMapping("/unsynced-courses/{userId}")
    public List<CourseResponseDTO> getUnsyncedCoursesByUserId(@PathVariable Long userId) {
        log.info("Getting unsynced courses for user: {}", userId);
        return courseService.getUnsyncedCoursesByUserId(userId);
    }

    @PostMapping("/sync-course")
    public ResponseEntity<CaptchaChallenge> syncCourse(
            @RequestParam Long courseId,
            @RequestParam(required = false) String captchaToken) {
        try {
            log.info("Starting sync for course: {} with captcha: {}", courseId, captchaToken != null);
            CaptchaChallenge result = stepikCourseSyncService.syncCourseWithStepik(courseId, captchaToken);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            log.warn("Sync failed for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to sync course {} with Stepik: {}", courseId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update-course/{courseId}")
    public ResponseEntity<StepikCourseResponseData> updateCourseInStepik(@PathVariable Long courseId) {
        try {
            log.info("Starting update for course: {}", courseId);
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
    public ResponseEntity<String> deleteCourseFromStepik(@PathVariable Long courseId) {
        try {
            log.info("Starting deletion for course: {}", courseId);
            stepikCourseSyncService.deleteCourseFromStepik(courseId);
            return ResponseEntity.ok("Course successfully deleted from Stepik");
        } catch (IllegalStateException e) {
            log.warn("Deletion failed for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Failed to delete course {} from Stepik: {}", courseId, e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to delete course from Stepik: " + e.getMessage());
        }
    }
}