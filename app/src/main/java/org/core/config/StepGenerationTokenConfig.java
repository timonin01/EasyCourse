package org.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class StepGenerationTokenConfig {

    private static final Set<String> LARGE_STEP_TYPES = Set.of(
            "code", "free-answer", "math", "string", "fill-blanks", "table", "random-tasks"
    );

    @Value("${max.tokens.generate}")
    private int defaultMaxTokens;

    @Value("${max.tokens.generate.large}")
    private int largeMaxTokens;

    @Value("${max.tokens.generate.text}")
    private int textMaxTokens;

    @Value("${max.tokens.batch}")
    private int batchMaxTokens;

    @Value("${max.tokens.batch.analyzer}")
    private int batchAnalyzerMaxTokens;

    public int getBatchMaxTokens() {
        return batchMaxTokens;
    }

    public int getBatchAnalyzerMaxTokens() {
        return batchAnalyzerMaxTokens;
    }

    public int resolveMaxTokens(String stepType) {
        if (stepType == null) {
            return defaultMaxTokens;
        }
        if ("text".equals(stepType)) {
            return textMaxTokens;
        }
        if (LARGE_STEP_TYPES.contains(stepType)) {
            return largeMaxTokens;
        }
        return defaultMaxTokens;
    }
}
