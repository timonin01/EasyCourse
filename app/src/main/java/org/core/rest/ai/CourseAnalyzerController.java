package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.dto.agent.CourseAnalyzerDTO;
import org.core.enums.LlmModel;
import org.core.exception.exceptions.SubscriptionLimitExceededException;
import org.core.service.agent.analyzer.CourseAnalyzerService;
import org.core.service.subscription.SubscriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agent/analyzer")
@RequiredArgsConstructor
@Slf4j
public class CourseAnalyzerController {

    private final UserContextBean userContextBean;
    private final SubscriptionService subscriptionService;
    private final CourseAnalyzerService courseAnalyzerService;

    @PostMapping("/course")
    public ResponseEntity<?> courseAnalyze(
            @RequestHeader("User-Id") Long userId,
            @RequestParam Long courseId,
            @RequestParam(required = false) String llmModel
    ) {
        userContextBean.setUserId(userId);

        try {
            LlmModel model = parseLlmModel(llmModel);
            subscriptionService.validateModelAccess(userId, model);
            subscriptionService.validateAiGenerationAllowed(userId, 1);

            CourseAnalyzerDTO courseAnalyzerDTO = courseAnalyzerService.courseAnalyze(userId, courseId, model);
            subscriptionService.recordAiUsage(userId, 1);
            return ResponseEntity.ok(courseAnalyzerDTO);
        } catch (IllegalArgumentException e) {
            ResponseEntity<?> accessDenied = courseAccessDeniedResponse(e);
            if (accessDenied != null) {
                return accessDenied;
            }
            log.error("Invalid LLM model: {}", llmModel);
            return ResponseEntity.badRequest().body("Неверная модель LLM: " + llmModel);
        } catch (SubscriptionLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception ex) {
            log.error("Error in courseAnalyzer endpoint: {}", ex.getMessage(), ex);
            return ResponseEntity.internalServerError().body("Ошибка при анализе курса");
        } finally {
            userContextBean.clear();
        }
    }

    private LlmModel parseLlmModel(String llmModel) {
        if (llmModel == null || llmModel.trim().isEmpty()) {
            return null;
        }
        return LlmModel.valueOf(llmModel.toUpperCase());
    }

    private ResponseEntity<?> courseAccessDeniedResponse(IllegalArgumentException e) {
        if ("Course does not belong to user".equals(e.getMessage())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
        return null;
    }
}
