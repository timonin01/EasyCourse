package org.core.service.agent.batch;

import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;

import java.util.List;
import java.util.Objects;
import java.util.function.Function;

public final class TheorySummaryCache {

    private String fingerprint;
    private String summary;

    public String getOrCompute(List<StepikBlockRequest> textBlocks, Function<List<StepikBlockRequest>, String> computer) {
        if (textBlocks == null || textBlocks.isEmpty()) {
            return null;
        }
        String currentFingerprint = fingerprint(textBlocks);
        if (Objects.equals(currentFingerprint, fingerprint) && summary != null) {
            return summary;
        }
        fingerprint = currentFingerprint;
        summary = computer.apply(textBlocks);
        return summary;
    }

    private static String fingerprint(List<StepikBlockRequest> textBlocks) {
        StringBuilder builder = new StringBuilder(textBlocks.size() * 64);
        for (StepikBlockRequest block : textBlocks) {
            builder.append(block.getClass().getName()).append('|');
            if (block instanceof StepikBlockTextRequest textRequest) {
                builder.append(Objects.toString(textRequest.getText(), ""));
            } else {
                builder.append(Objects.toString(block, ""));
            }
            builder.append('\n');
        }
        return Integer.toHexString(builder.toString().hashCode()) + ':' + textBlocks.size() + ':' + builder.length();
    }
}