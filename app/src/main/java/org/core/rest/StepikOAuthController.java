package org.core.rest;

import lombok.RequiredArgsConstructor;
import org.core.dto.user.StepikOAuthConfigDTO;
import org.core.service.StepikOAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stepik-oauth")
@RequiredArgsConstructor
public class StepikOAuthController {

    private final StepikOAuthService stepikOAuthService;

    @PostMapping("/config/{userId}")
    public ResponseEntity<String> updateStepikOAuthConfig(
            @PathVariable Long userId,
            @RequestBody StepikOAuthConfigDTO config) {
        
        stepikOAuthService.updateStepikOAuthConfig(userId, config);
        return ResponseEntity.ok("Stepik OAuth2 configuration updated successfully");
    }

    @GetMapping("/config/{userId}")
    public ResponseEntity<StepikOAuthConfigDTO> getStepikOAuthConfig(@PathVariable Long userId) {
        StepikOAuthConfigDTO config = stepikOAuthService.getStepikOAuthConfig(userId);
        return ResponseEntity.ok(config);
    }

    @DeleteMapping("/config/{userId}")
    public ResponseEntity<String> clearStepikOAuthConfig(@PathVariable Long userId) {
        stepikOAuthService.clearStepikOAuthConfig(userId);
        return ResponseEntity.ok("Stepik OAuth2 configuration cleared successfully");
    }

    @GetMapping("/config/{userId}/status")
    public ResponseEntity<Boolean> hasStepikOAuthConfig(@PathVariable Long userId) {
        boolean hasConfig = stepikOAuthService.hasStepikOAuthConfig(userId);
        return ResponseEntity.ok(hasConfig);
    }
}

