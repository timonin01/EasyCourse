package org.core.rest.stepik;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikStepSourceResponseData;
import org.core.service.stepik.step.StepikStepSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stepik/steps")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class StepikStepController {

    private final StepikStepSyncService stepikStepSyncService;

    @PostMapping("/sync-step")
    public ResponseEntity<StepikStepSourceResponseData> syncStepWithStepik(@RequestParam Long stepId) {
        log.info("Syncing step {} with Stepik", stepId);
        StepikStepSourceResponseData result = stepikStepSyncService.syncStepWithStepik(stepId);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/update-step/{stepId}")
    public ResponseEntity<StepikStepSourceResponseData> updateStepInStepik(@PathVariable Long stepId) {
        log.info("Updating step {} in Stepik", stepId);
        StepikStepSourceResponseData result = stepikStepSyncService.updateStepInStepik(stepId);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/delete-step/{stepId}")
    public ResponseEntity<Void> deleteStepFromStepik(@PathVariable Long stepId) {
        log.info("Deleting step {} from Stepik", stepId);
        stepikStepSyncService.deleteStepFromStepik(stepId);
        return ResponseEntity.ok().build();
    }
}
