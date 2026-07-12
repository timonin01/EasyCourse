package org.core.service.stepik.step;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.core.domain.StepType;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StepikBlockJsonNormalizer {

    private final ObjectMapper objectMapper;

    public String normalize(String rawJson, StepType stepType) {
        if (rawJson == null || rawJson.isBlank()) {
            return rawJson;
        }
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            if (!root.isObject()) {
                return rawJson;
            }
            ObjectNode object = (ObjectNode) root;
            ensureBlockName(object, stepType);
            normalizeTopLevelOptions(object);
            normalizeFillBlanks(object);
            normalizeChoice(object);
            normalizeNumber(object);
            normalizeMatching(object);
            normalizeSorting(object);
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            return rawJson;
        }
    }

    private void ensureBlockName(ObjectNode root, StepType stepType) {
        if (root.hasNonNull("name") && root.get("name").isTextual()) {
            return;
        }
        String blockName = blockNameFromStepType(stepType);
        if (blockName != null) {
            root.put("name", blockName);
        }
    }

    private void normalizeTopLevelOptions(ObjectNode root) {
        if (!root.has("options")) {
            return;
        }
        JsonNode options = root.get("options");
        if (options.isNull()) {
            return;
        }
        if (!options.isArray()) {
            root.putNull("options");
        }
    }

    private void normalizeFillBlanks(ObjectNode root) {
        JsonNode source = root.get("source");
        if (source == null || !source.isObject() || !source.has("components")) {
            return;
        }
        JsonNode components = source.get("components");
        if (!components.isArray()) {
            return;
        }
        for (JsonNode componentNode : components) {
            if (!componentNode.isObject()) {
                continue;
            }
            ObjectNode component = (ObjectNode) componentNode;
            coerceToText(component, "text");
            coerceToText(component, "type");
            JsonNode options = component.get("options");
            if (options != null && options.isArray()) {
                for (JsonNode optionNode : options) {
                    if (optionNode.isObject()) {
                        coerceToText((ObjectNode) optionNode, "text");
                    }
                }
            }
        }
    }

    private void normalizeChoice(ObjectNode root) {
        JsonNode source = root.get("source");
        if (source == null || !source.isObject()) {
            return;
        }
        JsonNode options = source.get("options");
        if (options == null || !options.isArray()) {
            return;
        }
        for (JsonNode optionNode : options) {
            if (optionNode.isObject()) {
                ObjectNode option = (ObjectNode) optionNode;
                coerceToText(option, "text");
                coerceToText(option, "feedback");
            }
        }
    }

    private void normalizeNumber(ObjectNode root) {
        JsonNode source = root.get("source");
        if (source == null || !source.isObject()) {
            return;
        }
        JsonNode options = source.get("options");
        if (options == null || !options.isArray()) {
            return;
        }
        for (JsonNode optionNode : options) {
            if (!optionNode.isObject()) {
                continue;
            }
            ObjectNode option = (ObjectNode) optionNode;
            coerceToText(option, "answer");
            coerceToText(option, "max_error");
            coerceToText(option, "z_re_min");
        }
    }

    private void normalizeMatching(ObjectNode root) {
        JsonNode source = root.get("source");
        if (source == null || !source.isObject()) {
            return;
        }
        normalizePairTexts(source.get("first_column"));
        normalizePairTexts(source.get("second_column"));
    }

    private void normalizeSorting(ObjectNode root) {
        JsonNode source = root.get("source");
        if (source == null || !source.isObject()) {
            return;
        }
        JsonNode options = source.get("options");
        if (options == null || !options.isArray()) {
            return;
        }
        for (JsonNode optionNode : options) {
            if (optionNode.isObject()) {
                coerceToText((ObjectNode) optionNode, "text");
            }
        }
    }

    private void normalizePairTexts(JsonNode pairs) {
        if (pairs == null || !pairs.isArray()) {
            return;
        }
        for (JsonNode pairNode : pairs) {
            if (pairNode.isObject()) {
                coerceToText((ObjectNode) pairNode, "text");
            }
        }
    }

    private void coerceToText(ObjectNode node, String field) {
        if (!node.has(field) || node.get(field).isNull()) {
            return;
        }
        JsonNode value = node.get(field);
        if (!value.isTextual()) {
            node.put(field, value.asText());
        }
    }

    private String blockNameFromStepType(StepType stepType) {
        if (stepType == null) {
            return null;
        }
        return switch (stepType) {
            case TEXT -> "text";
            case CHOICE -> "choice";
            case MATCHING -> "matching";
            case SORTING -> "sorting";
            case TABLE -> "table";
            case FILL_BLANK -> "fill-blanks";
            case STRING -> "string";
            case NUMBER -> "number";
            case MATH -> "math";
            case FREE_ANSWER -> "free-answer";
            case RANDOM_TASKS -> "random-tasks";
            case CODE -> "code";
            default -> null;
        };
    }
}
