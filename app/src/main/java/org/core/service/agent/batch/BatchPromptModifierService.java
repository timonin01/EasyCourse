package org.core.service.agent.batch;

import lombok.RequiredArgsConstructor;
import org.core.service.agent.SystemPromptService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BatchPromptModifierService {

    private final SystemPromptService systemPromptService;

    public String modifyPromptForBatch(String systemPrompt, int count) {
        return modifyPromptForBatch(systemPrompt, count, null);
    }

    public String modifyPromptForBatch(String systemPrompt, int count, String contextBlock) {
        return modifyPromptForBatch(systemPrompt, count, contextBlock, null);
    }

    public String modifyPromptForBatch(String systemPrompt, int count, String contextBlock, String stepType) {
        StringBuilder sb = new StringBuilder();        
        String batchPrompt = systemPromptService.getBatchPromptByQuery(stepType);

        if (batchPrompt != null) {
            sb.append(batchPrompt);
        } else {
            sb.append(systemPrompt).append("\n\n");
            sb.append("=== BATCH: СОЗДАЙ ").append(count).append(" ЗАДАНИЙ ===\n");
            sb.append("Верни JSON МАССИВ с ").append(count).append(" объектами: [{...}, {...}]\n");
            sb.append("ТОЛЬКО JSON без markdown ```, без дополнительного текста\n");
        }

        if (contextBlock != null && !contextBlock.isBlank()) {
            sb.append("\n=== КОНТЕКСТ ДЛЯ ЗАДАНИЙ ===\n")
              .append(contextBlock.trim())
              .append("\n\n");
        }

        String result = sb.toString();
        result = result.replaceAll("указанным количеством", count + " объектами");
        result = result.replaceAll("количество объектов", count + " объектов");
        
        if (!result.contains("" + count) && batchPrompt != null) {
            result = "Создай " + count + " заданий следующего типа.\n\n" + result;
        }
        
        return result;
    }
}
