package org.core.rest.stepik;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.stepik.step.StepikStepSourceResponseData;
import org.core.service.stepik.step.StepikStepSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stepik/steps")
@RequiredArgsConstructor
@Slf4j
public class StepikStepController {

    private final StepikStepSyncService stepikStepSyncService;
    private final UserContextBean userContextBean;

    @PostMapping("/sync-step")
    public ResponseEntity<StepikStepSourceResponseData> syncStepWithStepik(
            @RequestParam Long stepId,
            @RequestHeader("User-Id") Long userId) {

        log.info("Syncing step {} with Stepik for user {}", stepId, userId);
        userContextBean.setUserId(userId);

        StepikStepSourceResponseData result = stepikStepSyncService.syncStepWithStepik(stepId);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/update-step/{stepId}")
    public ResponseEntity<StepikStepSourceResponseData> updateStepInStepik(
            @PathVariable Long stepId,
            @RequestHeader("User-Id") Long userId) {

        log.info("Updating step {} in Stepik for user {}", stepId, userId);
        userContextBean.setUserId(userId);

        StepikStepSourceResponseData result = stepikStepSyncService.updateStepInStepik(stepId);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/delete-step/{stepId}")
    public ResponseEntity<Void> deleteStepFromStepik(
            @PathVariable Long stepId,
            @RequestHeader("User-Id") Long userId) {

        log.info("Deleting step {} from Stepik for user {}", stepId, userId);
        userContextBean.setUserId(userId);

        stepikStepSyncService.deleteStepFromStepik(stepId);
        return ResponseEntity.ok().build();
    }
}
