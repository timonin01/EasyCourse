package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.dto.agent.CourseAnalyzerDTO;
import org.core.dto.agent.CourseAuditPdfExportRequest;
import org.core.enums.LlmModel;
import org.core.exception.exceptions.SubscriptionLimitExceededException;
import org.core.service.agent.analyzer.CourseAnalyzerService;
import org.core.service.agent.analyzer.CourseAuditPdfService;
import org.core.service.subscription.SubscriptionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/agent/analyzer")
@RequiredArgsConstructor
@Slf4j
public class CourseAnalyzerController {

    private final UserContextBean userContextBean;
    private final SubscriptionService subscriptionService;
    private final CourseAnalyzerService courseAnalyzerService;
    private final CourseAuditPdfService courseAuditPdfService;

    @PostMapping("/course")
    public ResponseEntity<?> courseAnalyze(
            @RequestParam Long courseId,
            @RequestParam(required = false) String llmModel
    ) {
        Long userId = userContextBean.getUserId();
        if (!subscriptionService.isPro(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("AI-аудит курса доступен в подписке Pro");
        }
        try {
            LlmModel model = parseLlmModel(llmModel);
            subscriptionService.validateModelAccess(userId, model);
            subscriptionService.validateAiGenerationAllowed(userId, 1);

            CourseAnalyzerDTO courseAnalyzerDTO = courseAnalyzerService.courseAnalyze(userId, courseId, model);
            subscriptionService.recordAiUsage(userId, 1);
            return ResponseEntity.ok(courseAnalyzerDTO);
        } catch (IllegalArgumentException e) {
            log.error("Invalid LLM model: {}", llmModel);
            return ResponseEntity.badRequest().body("Неверная модель LLM: " + llmModel);
        } catch (SubscriptionLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PostMapping(value = "/export-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<?> exportCourseAuditPdf(@RequestBody CourseAuditPdfExportRequest request) throws IOException {
        Long userId = userContextBean.getUserId();
        if (!subscriptionService.isPro(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Экспорт PDF доступен в подписке Pro");
        }
        if (request == null || request.getCourseId() == null) {
            return ResponseEntity.badRequest().body("Не указан курс");
        }

        byte[] pdfBytes = courseAuditPdfService.generateForUser(userId, request);
        String filename = courseAuditPdfService.buildFilename(request.getCourseTitle());
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFilename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    private LlmModel parseLlmModel(String llmModel) {
        if (llmModel == null || llmModel.trim().isEmpty()) {
            return null;
        }
        return LlmModel.valueOf(llmModel.toUpperCase());
    }
}
