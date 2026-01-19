package org.core.service.stepik.step.validator;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.fillBlanks.request.StepikBlockFillBlanksRequest;
import org.core.dto.stepik.step.enterWord.fillBlanks.request.StepikFillBlanksComponentRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
@Slf4j
public class FillBlanksStepRequestBlockValidator {

    public void validateAndFixFillBlanksBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockFillBlanksRequest fillBlanksRequest) {
            if (fillBlanksRequest.getSource() != null && fillBlanksRequest.getSource().getComponents() != null) {
                for (int i = 0; i < fillBlanksRequest.getSource().getComponents().size(); i++) {
                    StepikFillBlanksComponentRequest component = fillBlanksRequest.getSource().getComponents().get(i);
                    if (component.getOptions() == null) {
                        component.setOptions(new ArrayList<>());
                    }

                    String originalType = component.getType();
                    String componentType = originalType;
                    if (componentType != null) {
                        componentType = componentType.trim().toLowerCase();
                    }

                    if ("input".equals(componentType)) {
                        log.error("Step {} has fill-blanks component[{}] with type 'input'. " +
                                        "Stepik API uses 'blank' instead. Converting 'input' to 'blank'.",
                                stepId, i);
                        componentType = "blank";
                    }
                    if (componentType == null || componentType.isEmpty()) {
                        if (!component.getOptions().isEmpty()) {
                            componentType = "blank";
                        } else {
                            componentType = "text";
                        }
                        log.error("Step {} has fill-blanks component[{}] with missing or empty type (original='{}'). " +
                                        "Stepik API requires this field. Setting type to '{}' based on component structure.",
                                stepId, i, originalType, componentType);
                        component.setType(componentType);
                    } else if (!componentType.equals("text") && !componentType.equals("blank")) {
                        String correctType = !component.getOptions().isEmpty() ? "blank" : "text";
                        log.error("Step {} has fill-blanks component[{}] with invalid type '{}' (normalized='{}'). " +
                                        "Stepik API only accepts 'text' or 'blank'. Setting type to '{}'.",
                                stepId, i, originalType, componentType, correctType);
                        component.setType(correctType);
                    } else {
                        component.setType(componentType);
                    }

                    if ("text".equals(component.getType())) {
                        if (component.getText() == null || component.getText().trim().isEmpty()) {
                            log.error("Step {} has fill-blanks component[{}] of type 'text' with missing or empty text. " +
                                    "Stepik API requires this field. Setting default empty string.", stepId, i);
                            component.setText("");
                        }
                    } else if ("blank".equals(component.getType())) {
                        if (component.getText() == null) {
                            component.setText("");
                        }

                        if (component.getOptions().isEmpty()) {
                            log.error("Step {} has fill-blanks component[{}] with type 'blank' but empty options. " +
                                    "Stepik API requires at least one option for 'blank' type. Changing type to 'text'.", stepId, i);
                            component.setType("text");
                        }
                    }

                    String finalType = component.getType();
                    if (finalType == null || finalType.trim().isEmpty()) {
                        log.error("Step {} component[{}] has null or empty type after all validations. " +
                                "This should not happen. Forcing type to 'text'.", stepId, i);
                        component.setType("text");
                    } else if (!"text".equals(finalType) && !"blank".equals(finalType)) {
                        log.error("Step {} component[{}] has invalid final type '{}' after all validations. " +
                                        "This should not happen. Forcing type to 'text'. Original type was '{}'.",
                                stepId, i, finalType, originalType);
                        component.setType("text");
                    } else {
                        component.setType(finalType.toLowerCase());
                        log.error("Step {} component[{}] validated: originalType='{}', finalType='{}', hasOptions={}",
                                stepId, i, originalType, component.getType(), !component.getOptions().isEmpty());
                    }
                }
            }
        }
    }

}
