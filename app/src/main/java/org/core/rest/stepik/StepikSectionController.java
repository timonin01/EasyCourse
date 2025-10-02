package org.core.rest.stepik;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.service.crud.ModelService;
import org.core.service.stepik.section.StepikSectionSyncService;
import org.core.service.stepik.section.SyncAllCourseSectionsFromStepikService;
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

    @GetMapping("/unsynced-models/{courseId}")
    public List<ModelResponseDTO> getUnsyncedModelsByCourseId(@PathVariable Long courseId) {
        log.info("Getting unsynced models for course: {}", courseId);
        return modelService.getUnsyncedModelsByCourseId(courseId);
    }

    @PostMapping("/sync-model")
    public ResponseEntity<StepikSectionResponseData> syncModel(@RequestParam Long modelId) {
        try {
            log.info("Starting sync for model: {}", modelId);
            StepikSectionResponseData responseData = stepikSectionSyncService.syncModelWithStepik(modelId);
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
    public ResponseEntity<StepikSectionResponseData> updateModelInStepik(@PathVariable Long modelId) {
        try {
            log.info("Starting update for model: {}", modelId);
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
    public ResponseEntity<String> deleteModelFromStepik(@PathVariable Long modelId) {
        try {
            log.info("Starting deletion for model: {}", modelId);
            stepikSectionSyncService.deleteModelFromStepik(modelId);
            return ResponseEntity.ok("Model section successfully deleted from Stepik");
        } catch (IllegalStateException e) {
            log.warn("Deletion failed for model {}: {}", modelId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Failed to delete model {} from Stepik: {}", modelId, e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to delete model from Stepik: " + e.getMessage());
        }
    }

    @PostMapping("/sync-course-sections")
    public ResponseEntity<List<ModelResponseDTO>> syncAllCourseSectionFromStepik(@RequestParam Long courseId){
        log.info("Syncing all sections for course {} from Stepik", courseId);
        List<ModelResponseDTO> sections = stepikSectionSyncService.syncAllCourseSectionFromStepik(courseId);
        return ResponseEntity.ok(sections);
    }
}
