package org.core.rest.stepik;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.service.crud.ModelService;
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
    private final ModelService modelService;
    private final UserContextBean userContextBean;

    private final StepikCascadeSyncService cascadeSyncService;
    private final StepikCascadeDeleteService cascadeDeleteService;

    @GetMapping("/unsynced-models/{courseId}")
    public List<ModelResponseDTO> getUnsyncedModelsByCourseId(
            @PathVariable Long courseId,
            @RequestHeader("User-Id") Long userId) {
        log.info("Getting unsynced models for course: {}", courseId);
        userContextBean.setUserId(userId);
        return modelService.getUnsyncedModelsByCourseId(courseId);
    }

    @PostMapping("/sync-model")
    public ResponseEntity<StepikSectionResponseData> syncModel(
            @RequestParam Long modelId,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting sync for model: {}", modelId);
            StepikSectionResponseData responseData = cascadeSyncService.syncFullSectionById(modelId, null, userId);
            return ResponseEntity.ok(responseData);
        } catch (IllegalStateException e) {
            log.warn("Sync failed for model {}: {}", modelId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to sync model {} with Stepik: {}", modelId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update-model/{modelId}")
    public ResponseEntity<StepikSectionResponseData> updateModelInStepik(
            @PathVariable Long modelId,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting update for model: {}", modelId);
            userContextBean.setUserId(userId);
            StepikSectionResponseData responseData = stepikSectionSyncService.updateModelInStepik(modelId);
            return ResponseEntity.ok(responseData);
        } catch (IllegalStateException e) {
            log.warn("Update failed for model {}: {}", modelId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Failed to update model {} in Stepik: {}", modelId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/delete-model/{modelId}")
    public ResponseEntity<String> deleteModelFromStepik(
            @PathVariable Long modelId,
            @RequestHeader("User-Id") Long userId) {
        try {
            log.info("Starting deletion for model: {}", modelId);
            cascadeDeleteService.deleteFullSectionFromStepikById(modelId, userId);
            return ResponseEntity.ok("Model section successfully deleted from Stepik");
        } catch (IllegalStateException e) {
            log.warn("Deletion failed for model {}: {}", modelId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Failed to delete model {} from Stepik: {}", modelId, e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to delete model from Stepik: " + e.getMessage());
        }
    }
}
