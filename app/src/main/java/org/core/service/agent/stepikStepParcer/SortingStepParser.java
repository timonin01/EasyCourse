package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.test.sorting.request.StepikBlockSortingRequest;
import org.core.dto.stepik.step.test.sorting.request.StepikSortingOptionRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class SortingStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseSortingRequest(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isObject() && !node.has("name")) {
                ((ObjectNode) node).put("name", "sorting");
            }
            StepikBlockSortingRequest request = objectMapper.treeToValue(node, StepikBlockSortingRequest.class);
            if (!validateSortingRequest(request)) {
                throw new IllegalArgumentException("Invalid sorting request structure");
            }
            return request;
        } catch (Exception e) {
            log.error("Failed to parse sorting request: {}", e.getMessage());
            throw new RuntimeException("Invalid sorting request format", e);
        }
    }
    
    private boolean validateSortingRequest(StepikBlockSortingRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("Sorting request validation failed: empty text");
            return false;
        }
        if (request.getSource() == null || request.getSource().getOptions() == null) {
            log.warn("Sorting request validation failed: missing source or options");
            return false;
        }
        
        List<StepikSortingOptionRequest> options = request.getSource().getOptions();
        if (options.size() < 2) {
            log.warn("Sorting request validation failed: expected at least 2 options, got {}", options.size());
            return false;
        }
        if (options.size() > 10) {
            log.warn("Sorting request validation failed: too many options, got {}", options.size());
            return false;
        }
        
        boolean allOptionsHaveText = options.stream()
            .allMatch(option -> option.getText() != null && !option.getText().trim().isEmpty());
            
        if (!allOptionsHaveText) {
            log.warn("Sorting request validation failed: some options are missing text");
            return false;
        }
        return true;
    }
}
