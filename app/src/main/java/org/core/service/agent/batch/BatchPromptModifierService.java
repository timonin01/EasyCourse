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
        sb.append("=== BATCH: СТРОГО ").append(count).append(" ЗАДАНИЙ ===\n");
        sb.append("Верни JSON-массив РОВНО с ").append(count).append(" объектами — ни больше, ни меньше.\n");
        sb.append("НЕ трать весь бюджет ответа на одно задание: распределяй объём равномерно между всеми ")
          .append(count).append(" заданиями.\n");
        sb.append("Каждое задание должно быть компактным и самодостаточным, чтобы все ")
          .append(count).append(" уместились в один ответ.\n");
        sb.append("ТОЛЬКО JSON без markdown ```, без дополнительного текста.\n\n");

        String batchPrompt = systemPromptService.getBatchPromptByQuery(stepType);

        if (batchPrompt != null) {
            sb.append(batchPrompt);
        } else {
            sb.append(systemPrompt).append("\n\n");
            sb.append("Верни JSON МАССИВ с ").append(count).append(" объектами: [{...}, {...}]\n");
        }

        if (contextBlock != null && !contextBlock.isBlank()) {
            sb.append("\n=== КОНТЕКСТ ДЛЯ ЗАДАНИЙ ===\n")
              .append(contextBlock.trim())
              .append("\n\n");
        }

        String result = sb.toString();
        result = result.replaceAll("указанным количеством", count + " объектами");
        result = result.replaceAll("количество объектов", count + " объектов");

        return result;
    }
}
