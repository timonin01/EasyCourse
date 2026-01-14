package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.fillBlanks.request.StepikBlockFillBlanksRequest;
import org.core.dto.stepik.step.enterWord.fillBlanks.request.StepikFillBlanksComponentRequest;
import org.core.dto.stepik.step.enterWord.fillBlanks.request.StepikFillBlanksOptionRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class FillBlanksStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseFillBlanksRequest(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isObject()) {
                ObjectNode objectNode = (ObjectNode) node;
                if (!objectNode.has("name") || objectNode.get("name").isNull()) {
                    objectNode.put("name", "fill-blanks");
                }
            }
            String jsonWithName = objectMapper.writeValueAsString(node);
            StepikBlockFillBlanksRequest request = objectMapper.readValue(jsonWithName, StepikBlockFillBlanksRequest.class);
            
            fixMissingIsCorrect(request);
            if (!validateFillBlanksRequest(request)) {
                throw new IllegalArgumentException("Invalid fill-blanks request structure");
            }
            return request;
        } catch (Exception e) {
            log.error("Failed to parse fill-blanks request: {}", e.getMessage(), e);
            throw new RuntimeException("Invalid fill-blanks request format", e);
        }
    }
    
    private void fixMissingIsCorrect(StepikBlockFillBlanksRequest request) {
        if (request == null || request.getSource() == null || request.getSource().getComponents() == null) {
            return;
        }
        
        for (StepikFillBlanksComponentRequest component : request.getSource().getComponents()) {
            if ("blank".equalsIgnoreCase(component.getType()) && component.getOptions() != null) {
                boolean hasAnyCorrect = component.getOptions().stream()
                        .anyMatch(o -> Boolean.TRUE.equals(o.getIs_correct()));
                
                if (!hasAnyCorrect) {
                    log.warn("Blank component has no correct options, attempting to auto-fix based on text patterns");
                    boolean foundCorrect = false;
                    
                    for (int i = 0; i < component.getOptions().size(); i++) {
                        StepikFillBlanksOptionRequest option = component.getOptions().get(i);
                        String text = option.getText() != null ? option.getText().toLowerCase() : "";
                        
                        boolean isCorrect = text.startsWith("правильн") || 
                                           text.contains("правильный вариант") ||
                                           (i == 0 && !text.startsWith("неверн") && !text.contains("неверный"));
                        
                        if (isCorrect && !foundCorrect) {
                            option.setIs_correct(true);
                            foundCorrect = true;
                            log.info("Auto-set is_correct=true for option: '{}'", option.getText());
                            
                            String cleanedText = cleanOptionText(option.getText());
                            if (!cleanedText.equals(option.getText())) {
                                option.setText(cleanedText);
                                log.info("Cleaned option text to: '{}'", cleanedText);
                            }
                        } else {
                            option.setIs_correct(false);
                            String cleanedText = cleanOptionText(option.getText());
                            if (!cleanedText.equals(option.getText())) {
                                option.setText(cleanedText);
                                log.info("Cleaned option text to: '{}'", cleanedText);
                            }
                        }
                    }
                }
            }
        }
    }

    private String cleanOptionText(String text) {
        if (text == null) return "";
        
        String[] prefixes = {
            "Правильный вариант:", "Неверный вариант:",
            "правильный вариант:", "неверный вариант:",
            "Правильный вариант", "Неверный вариант",
            "правильный вариант", "неверный вариант"
        };
        
        String result = text.trim();
        for (String prefix : prefixes) {
            if (result.toLowerCase().startsWith(prefix.toLowerCase())) {
                result = result.substring(prefix.length()).trim();
                // Remove leading comma or colon if present
                if (result.startsWith(",") || result.startsWith(":")) {
                    result = result.substring(1).trim();
                }
                break;
            }
        }
        
        return result;
    }

    private boolean validateFillBlanksRequest(StepikBlockFillBlanksRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("Fill-blanks validation failed: empty text");
            return false;
        }

        if (request.getSource() == null || request.getSource().getComponents() == null) {
            log.warn("Fill-blanks validation failed: missing source/components");
            return false;
        }

        List<StepikFillBlanksComponentRequest> components = request.getSource().getComponents();
        if (components.isEmpty()) {
            log.warn("Fill-blanks validation failed: components empty");
            return false;
        }

        boolean hasBlankWithOptions = false;
        for (StepikFillBlanksComponentRequest component : components) {
            if (component.getType() == null || component.getType().trim().isEmpty()) {
                log.warn("Fill-blanks validation failed: component type empty");
                return false;
            }
            if ("text".equalsIgnoreCase(component.getType())) {
                if (component.getText() == null || component.getText().trim().isEmpty()) {
                    log.warn("Fill-blanks validation failed: text component has empty text");
                    return false;
                }
            } else if ("blank".equalsIgnoreCase(component.getType())) {
                List<StepikFillBlanksOptionRequest> options = component.getOptions();
                if (options == null || options.isEmpty()) {
                    log.warn("Fill-blanks validation failed: blank component has no options");
                    return false;
                }
                boolean anyCorrect = options.stream()
                        .anyMatch(o -> Boolean.TRUE.equals(o.getIs_correct()));
                if (!anyCorrect) {
                    log.warn("Fill-blanks validation failed: blank component has no correct option");
                    return false;
                }
                hasBlankWithOptions = true;
            } else {
                log.warn("Fill-blanks validation failed: unknown component type {}", component.getType());
                return false;
            }
        }

        if (!hasBlankWithOptions) {
            log.warn("Fill-blanks validation failed: no blank component with options");
            return false;
        }

        return true;
    }
}


