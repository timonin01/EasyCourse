package org.core.rest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.CaptchaChallenge;
import org.core.service.stepik.StepikCourseSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stepik")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class StepikCaptchaController {

    private final StepikCourseSyncService stepikSyncService;

    @PostMapping("/sync-course")
    public ResponseEntity<CaptchaChallenge> syncCourse(
            @RequestParam Long courseId,
            @RequestParam(required = false) String captchaToken) {
        try {
            CaptchaChallenge result = stepikSyncService.syncCourseWithStepik(courseId, captchaToken);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to sync course {} with Stepik: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
