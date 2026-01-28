package org.core.service.stepik.step.validator;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.test.matching.request.StepikBlockMatchingRequest;
import org.core.dto.stepik.step.test.matching.request.StepikMatchingPairRequest;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@Slf4j
public class MatchingTasksStepRequestBlockValidator {

    /**
     * Stepik requires matching pairs to have unique "first" and "second" values (case-insensitive).
     * Otherwise it returns "Ambiguous pairs" (plugins.matching.errors.pairs-ambiguous).
     * This validator appends " (2)", " (3)" etc. to duplicates to make them unique.
     */
    public void validateAndFixMatchingBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (!(blockRequest instanceof StepikBlockMatchingRequest matchingRequest)) {
            return;
        }
        if (matchingRequest.getSource() == null || matchingRequest.getSource().getPairs() == null) {
            return;
        }
        List<StepikMatchingPairRequest> pairs = matchingRequest.getSource().getPairs();

        Set<String> usedFirst = new HashSet<>();
        Set<String> usedSecond = new HashSet<>();

        for (StepikMatchingPairRequest pair : pairs) {
            String first = pair.getFirst() == null ? "" : pair.getFirst().trim();
            String second = pair.getSecond() == null ? "" : pair.getSecond().trim();

            String firstKey = first.toLowerCase();
            int n = 2;
            while (usedFirst.contains(firstKey)) {
                log.warn("Step {} matching: duplicate 'first' value. Appending \" ({})\" to make unique.", stepId, n);
                String suffixed = first + " (" + n + ")";
                firstKey = suffixed.toLowerCase();
                n++;
                first = suffixed;
            }
            usedFirst.add(firstKey);
            pair.setFirst(first);

            String secondKey = second.toLowerCase();
            n = 2;
            while (usedSecond.contains(secondKey)) {
                log.warn("Step {} matching: duplicate 'second' value. Appending \" ({})\" to make unique.", stepId, n);
                String suffixed = second + " (" + n + ")";
                secondKey = suffixed.toLowerCase();
                n++;
                second = suffixed;
            }
            usedSecond.add(secondKey);
            pair.setSecond(second);
        }
    }
}
