package org.core.service.stepik;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.stepik.StepikSyncFailure;
import org.core.util.CleanerHtmlTags;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class StepikSyncFailureHelper {

    private static final int STEP_TITLE_MAX_LEN = 80;

    private final CleanerHtmlTags cleanerHtmlTags;

    public String stepTitle(StepResponseDTO step) {
        if (step.getContent() != null && !step.getContent().isBlank()) {
            String plain = cleanerHtmlTags.cleanHtmlTags(step.getContent());
            if (plain != null && !plain.isEmpty()) {
                return plain.length() <= STEP_TITLE_MAX_LEN
                        ? plain
                        : plain.substring(0, STEP_TITLE_MAX_LEN) + "...";
            }
        }
        return step.getType() != null ? step.getType().name() : ("step-" + step.getId());
    }

    public String buildSyncSummaryMessage(String baseMessage, List<StepikSyncFailure> failures) {
        String base = baseMessage != null && !baseMessage.isBlank()
                ? baseMessage
                : "Синхронизация завершена";
        if (failures == null || failures.isEmpty()) {
            return base;
        }
        long stepFails = failures.stream().filter(f -> "step".equals(f.getEntityType())).count();
        long lessonFails = failures.stream().filter(f -> "lesson".equals(f.getEntityType())).count();
        long sectionFails = failures.stream().filter(f -> "section".equals(f.getEntityType())).count();

        List<String> parts = new ArrayList<>();
        if (sectionFails > 0) {
            parts.add(sectionFails + " модул.");
        }
        if (lessonFails > 0) {
            parts.add(lessonFails + " урок.");
        }
        if (stepFails > 0) {
            parts.add(stepFails + " шаг.");
        }
        return base + ". Частичные ошибки: " + String.join(", ", parts) + " (см. failures)";
    }

    public void logFailures(String scope, Long scopeId, List<StepikSyncFailure> failures) {
        if (failures == null || failures.isEmpty()) {
            return;
        }
        log.warn("{} {} sync finished with {} failure(s)", scope, scopeId, failures.size());
        for (StepikSyncFailure failure : failures) {
            log.warn("Sync failure: {} id={} title='{}' error={}",
                    failure.getEntityType(), failure.getEntityId(), failure.getTitle(), failure.getError());
        }
    }
}
