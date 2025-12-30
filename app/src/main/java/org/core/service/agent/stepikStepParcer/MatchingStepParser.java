package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.test.matching.request.StepikBlockMatchingRequest;
import org.core.dto.stepik.step.test.matching.request.StepikMatchingPairRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class MatchingStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseMatchingRequest(String json) {
        try {
            JsonFactory jsonFactory = JsonFactory.builder()
                    .enable(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS)
                    .build();
            
            ObjectMapper lenientMapper = new ObjectMapper(jsonFactory);
            lenientMapper.setConfig(objectMapper.getDeserializationConfig());
            lenientMapper.setConfig(objectMapper.getSerializationConfig());
            
            JsonNode node = lenientMapper.readTree(json);
            if (node.isObject() && !node.has("name")) {
                ((ObjectNode) node).put("name", "matching");
            }
            StepikBlockMatchingRequest request = lenientMapper.treeToValue(node, StepikBlockMatchingRequest.class);
            if (!validateMatchingRequest(request)) {
                throw new IllegalArgumentException("Invalid matching request structure");
            }
            return request;
        } catch (Exception e) {
            log.error("Failed to parse matching request: {}", e.getMessage());
            throw new RuntimeException("Invalid matching request format", e);
        }
    }

    private boolean validateMatchingRequest(StepikBlockMatchingRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("Matching request validation failed: empty text");
            return false;
        }
        if (request.getSource() == null || request.getSource().getPairs() == null) {
            log.warn("Matching request validation failed: missing source or pairs");
            return false;
        }
        List<StepikMatchingPairRequest> pairs = request.getSource().getPairs();
        if (pairs.size() < 2) {
            log.warn("Matching request validation failed: expected at least 2 pairs, got {}", pairs.size());
            return false;
        }

        boolean allPairsValid = pairs.stream().allMatch(p ->
            p.getFirst() != null && !p.getFirst().trim().isEmpty() &&
            p.getSecond() != null && !p.getSecond().trim().isEmpty()
        );
        if (!allPairsValid) {
            log.warn("Matching request validation failed: some pairs have empty values");
            return false;
        }
        return true;
    }
}


