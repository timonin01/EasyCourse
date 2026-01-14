package org.core.rest.stepik;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.service.crud.SectionService;
import org.core.service.stepik.StepikCascadeDeleteService;
import org.core.service.stepik.StepikCascadeSyncService;
import org.core.service.stepik.section.StepikSectionSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stepik/sections")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
@CrossOrigin(origins = "*")
public class StepikSectionController {

    private final StepikSectionSyncService stepikSectionSyncService;
    private final SectionService sectionService;
    private final UserContextBean userContextBean;

    private final StepikCascadeSyncService cascadeSyncService;
    private final StepikCascadeDeleteService cascadeDeleteService;

    @GetMapping("/unsynced-sections/{courseId}")
    public List<SectionResponseDTO> getUnsyncedSectionsByCourseId(
            @PathVariable Long courseId,
            @RequestHeader("User-Id") Long userId) {
        log.info("Getting unsynced sections for course: {}", courseId);
        userContextBean.setUserId(userId);
        return sectionService.getUnsyncedSectionsByCourseId(courseId);
    }

    @PostMapping("/sync-section")
    public ResponseEntity<StepikSectionResponseData> syncSection(
            @RequestParam("sectionId") Long sectionId,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting sync section: {}", sectionId);
            StepikSectionResponseData responseData = cascadeSyncService.syncFullSectionById(sectionId, null, userId);
            return ResponseEntity.ok(responseData);
        } catch (IllegalStateException e) {
            log.warn("Sync failed for section {}: {}", sectionId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to sync section {} with Stepik: {}", sectionId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update-section/{sectionId}")
    public ResponseEntity<StepikSectionResponseData> updateSectionInStepik(
            @PathVariable Long sectionId,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting update section: {}", sectionId);
            userContextBean.setUserId(userId);
            StepikSectionResponseData responseData = stepikSectionSyncService.updateSectionInStepik(sectionId);
            return ResponseEntity.ok(responseData);
        } catch (IllegalStateException e) {
            log.warn("Update failed for section {}: {}", sectionId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to update section {} in Stepik: {}", sectionId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/delete-section/{sectionId}")
    public ResponseEntity<String> deleteSectionFromStepik(
            @PathVariable Long sectionId,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting deletion section: {}", sectionId);
            cascadeDeleteService.deleteFullSectionFromStepikById(sectionId, userId);
            return ResponseEntity.ok("Section successfully deleted from Stepik");
        } catch (IllegalStateException e) {
            log.warn("Deletion failed for section {}: {}", sectionId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Failed to delete section {} from Stepik: {}", sectionId, e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to delete section from Stepik: " + e.getMessage());
        }
    }
}
