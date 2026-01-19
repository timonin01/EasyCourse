package org.core.service.stepik.step;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Step;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.StepikStepSourceRequestData;
import org.core.dto.stepik.step.enterWord.randomTasks.request.StepikRandomTasksSourceRequest;
import org.core.dto.stepik.step.enterWord.string.request.StepikStringSourceRequest;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.core.dto.stepik.step.enterWord.fillBlanks.request.StepikBlockFillBlanksRequest;
import org.core.dto.stepik.step.enterWord.fillBlanks.request.StepikFillBlanksComponentRequest;
import org.core.dto.stepik.step.enterWord.string.request.StepikBlockStringRequest;
import org.core.dto.stepik.step.enterWord.number.request.StepikBlockNumberRequest;
import org.core.dto.stepik.step.enterWord.number.request.StepikNumberOptionRequest;
import org.core.dto.stepik.step.enterWord.randomTasks.request.StepikBlockRandomTasksRequest;
import org.core.dto.stepik.step.test.choise.request.StepikBlockChoiceRequest;
import org.core.dto.stepik.step.test.choise.request.StepikChoiceOptionRequest;
import org.core.dto.stepik.step.test.table.request.StepikBlockTableRequest;
import org.core.dto.stepik.step.test.table.request.StepikTableCellRequest;
import org.core.exception.exceptions.StepikStepIntegrationException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikStepSourceDataRequestBuilder {

    private final ObjectMapper objectMapper;

    public StepikStepSourceRequestData createRequestDataForCreate(Step step) {
        StepikStepSourceRequestData requestData = new StepikStepSourceRequestData();
        requestData.setLesson(step.getLesson().getStepikLessonId().toString());
        requestData.setPosition(step.getPosition());
        requestData.setCost(step.getCost() != null ? step.getCost().intValue() : 0);
        requestData.setStatus("ready");
        requestData.setIsEnabled(true);

        try {
            if (step.getStepikBlockData() != null && !step.getStepikBlockData().trim().isEmpty()) {
                StepikBlockRequest stepikBlockRequest = objectMapper.readValue(step.getStepikBlockData(), StepikBlockRequest.class);
                
                validateAndFixFillBlanksBlock(stepikBlockRequest, step.getId());
                validateAndFixStringBlock(stepikBlockRequest, step.getId());
                validateAndFixNumberBlock(stepikBlockRequest, step.getId());
                validateAndFixRandomTasksBlock(stepikBlockRequest, step.getId());
                validateAndFixChoiceBlock(stepikBlockRequest, step.getId());
                validateAndFixTableBlock(stepikBlockRequest, step.getId());
                
                requestData.setBlock(stepikBlockRequest);
            } else {
                log.warn("No stepikBlockData found for step ID: {}, creating default text block", step.getId());
                StepikBlockTextRequest defaultBlock = new StepikBlockTextRequest();
                defaultBlock.setText(step.getContent());
                requestData.setBlock(defaultBlock);
            }
        } catch (JsonProcessingException e) {
            log.error("Error parsing stepikBlockData for step ID: {}: {}", step.getId(), e.getMessage());
            throw new StepikStepIntegrationException("Failed to parse stepikBlockData: " + e.getMessage());
        }
        return requestData;
    }

    public StepikStepSourceRequestData createRequestDataForUpdate(Step step) {
        StepikStepSourceRequestData requestData = new StepikStepSourceRequestData();
        requestData.setLesson(step.getLesson().getStepikLessonId().toString());
        requestData.setPosition(step.getPosition());
        requestData.setCost(step.getCost() != null ? step.getCost().intValue() : 0);
        requestData.setStatus("ready");
        requestData.setIsEnabled(true);

        try {
            if (step.getStepikBlockData() != null && !step.getStepikBlockData().trim().isEmpty()) {
                StepikBlockRequest stepikBlockRequest = objectMapper.readValue(step.getStepikBlockData(), StepikBlockRequest.class);
                
                validateAndFixFillBlanksBlock(stepikBlockRequest, step.getId());
                validateAndFixStringBlock(stepikBlockRequest, step.getId());
                validateAndFixNumberBlock(stepikBlockRequest, step.getId());
                validateAndFixRandomTasksBlock(stepikBlockRequest, step.getId());
                validateAndFixChoiceBlock(stepikBlockRequest, step.getId());
                validateAndFixTableBlock(stepikBlockRequest, step.getId());
                
                requestData.setBlock(stepikBlockRequest);
            } else {
                log.warn("No stepikBlockData found for step ID: {}, creating default text block", step.getId());
                StepikBlockTextRequest defaultBlock = new StepikBlockTextRequest();
                defaultBlock.setText(step.getContent());
                requestData.setBlock(defaultBlock);
            }
        } catch (JsonProcessingException e) {
            log.error("Error parsing stepikBlockData for step ID: {}: {}", step.getId(), e.getMessage());
            throw new StepikStepIntegrationException("Failed to parse stepikBlockData: " + e.getMessage());
        }
        return requestData;
    }

    private void validateAndFixFillBlanksBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockFillBlanksRequest fillBlanksRequest) {
            if (fillBlanksRequest.getSource() != null && fillBlanksRequest.getSource().getComponents() != null) {
                        
                for (int i = 0; i < fillBlanksRequest.getSource().getComponents().size(); i++) {
                    StepikFillBlanksComponentRequest component = fillBlanksRequest.getSource().getComponents().get(i);
                    
                    String textPreview = component.getText() != null 
                            ? component.getText().substring(0, Math.min(50, component.getText().length())) 
                            : "null";

                    if (component.getOptions() == null) {
                        component.setOptions(new ArrayList<>());
                    }
                    
                    String originalType = component.getType();
                    String componentType = originalType;
                    if (componentType != null) {
                        componentType = componentType.trim().toLowerCase();
                    }
                    
                    if (componentType == null || componentType.isEmpty()) {
                        if (!component.getOptions().isEmpty()) {
                            componentType = "blank";
                        } else {
                            componentType = "text";
                        }
                        log.warn("Step {} has fill-blanks component[{}] with missing or empty type (original='{}'). " +
                                "Stepik API requires this field. Setting type to '{}' based on component structure.", 
                                stepId, i, originalType, componentType);
                        component.setType(componentType);
                    } else if (!componentType.equals("text") && !componentType.equals("blank")) {
                        String correctType = !component.getOptions().isEmpty() ? "blank" : "text";
                        log.warn("Step {} has fill-blanks component[{}] with invalid type '{}' (normalized='{}'). " +
                                "Stepik API only accepts 'text' or 'blank'. Setting type to '{}'.", 
                                stepId, i, originalType, componentType, correctType);
                        component.setType(correctType);
                    } else {
                        component.setType(componentType);
                    }
                    
                    if ("text".equals(component.getType())) {
                        if (component.getText() == null || component.getText().trim().isEmpty()) {
                            log.warn("Step {} has fill-blanks component[{}] of type 'text' with missing or empty text. " +
                                    "Stepik API requires this field. Setting default empty string.", stepId, i);
                            component.setText("");
                        }
                    } else if ("blank".equals(component.getType())) {
                        if (component.getText() == null) {
                            component.setText("");
                        }
                        
                        if (component.getOptions().isEmpty()) {
                            log.warn("Step {} has fill-blanks component[{}] with type 'blank' but empty options. " +
                                    "Stepik API requires at least one option for 'blank' type. Changing type to 'text'.", stepId, i);
                            component.setType("text");
                        }
                    }
                    
                    String finalType = component.getType();
                    if (!"text".equals(finalType) && !"blank".equals(finalType)) {
                        log.error("Step {} component[{}] has invalid final type '{}' after all validations. " +
                                "This should not happen. Forcing type to 'text'.", stepId, i, finalType);
                        component.setType("text");
                    }
                }
            }
        }
    }

    private void validateAndFixStringBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockStringRequest stringRequest) {
            if (stringRequest.getSource() != null) {
                if (stringRequest.getSource().getCode() == null || stringRequest.getSource().getCode().trim().isEmpty()) {
                    log.error("Step {} has string step with missing or empty code field. " +
                            "Stepik API requires this field. Setting default empty string.", stepId);
                    stringRequest.getSource().setCode("");
                }
            } else {
                log.error("Step {} has string step with missing source. " +
                        "Stepik API requires source with code field. Creating default source.", stepId);
                StepikStringSourceRequest source = new StepikStringSourceRequest();
                source.setCode("");
                stringRequest.setSource(source);
            }
        }
    }

    private void validateAndFixNumberBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockNumberRequest numberRequest) {
            if (numberRequest.getSource() != null && numberRequest.getSource().getOptions() != null) {
                List<StepikNumberOptionRequest> options = numberRequest.getSource().getOptions();
                for (int i = 0; i < options.size(); i++) {
                    StepikNumberOptionRequest option = options.get(i);
                    if (option == null) {
                        log.warn("Step {} has null number option[{}]. Creating default option.", stepId, i);
                        option = new StepikNumberOptionRequest();
                        options.set(i, option);
                    }
                    
                    if (option.getZReMin() == null) {
                        log.warn("Step {} has number option[{}] with null z_re_min field. " +
                                "Stepik API REQUIRES this field. Setting to empty string.", stepId, i);
                        option.setZReMin("");
                    }
                    
                    if (option.getIntegerOnly() == null) {
                        log.warn("Step {} has number option[{}] with null integer_only field. " +
                                "Stepik API REQUIRES this field. Setting to false by default.", stepId, i);
                        option.setIntegerOnly(false);
                    }
                    
                    if (option.getMaxError() == null) {
                        log.warn("Step {} has number option[{}] with null max_error field. " +
                                "Stepik API REQUIRES this field. Setting to empty string.", stepId, i);
                        option.setMaxError("");
                    }
                    
                    log.info("Step {} number option[{}] after validation: answer='{}', max_error='{}', z_re_min='{}', integer_only={}", 
                            stepId, i, option.getAnswer(), option.getMaxError(), option.getZReMin(), option.getIntegerOnly());
                }
            } else {
                log.warn("Step {} is a number step but has no source or options. Stepik API may reject this.", stepId);
            }
        }
    }

    private void validateAndFixRandomTasksBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockRandomTasksRequest randomTasksRequest) {
            if (randomTasksRequest.getSource() != null) {
                if (randomTasksRequest.getSource().getMaxError() == null) {
                    log.warn("Step {} has random-tasks step with missing max_error field. " +
                            "Stepik API requires this field as a string. Setting to empty string.", stepId);
                    randomTasksRequest.getSource().setMaxError("");
                }
                if (randomTasksRequest.getSource().getTask() == null || randomTasksRequest.getSource().getTask().trim().isEmpty()) {
                    log.warn("Step {} has random-tasks step with missing or empty task field. " +
                            "Stepik API requires this field. Setting to empty string.", stepId);
                    randomTasksRequest.getSource().setTask("");
                }
                if (randomTasksRequest.getSource().getSolve() == null || randomTasksRequest.getSource().getSolve().trim().isEmpty()) {
                    log.warn("Step {} has random-tasks step with missing or empty solve field. " +
                            "Stepik API requires this field. Setting to empty string.", stepId);
                    randomTasksRequest.getSource().setSolve("");
                }
                Object ranges = randomTasksRequest.getSource().getRanges();
                if (ranges == null) {
                    log.warn("Step {} has random-tasks step with null ranges. " +
                            "Stepik API requires this field. Setting to empty list.", stepId);
                    randomTasksRequest.getSource().setRanges(new java.util.ArrayList<>());
                } else if (ranges instanceof java.util.Map && ((java.util.Map<?, ?>) ranges).isEmpty()) {
                    log.warn("Step {} has random-tasks step with ranges as empty map. " +
                            "Stepik API expects a list. Converting to empty list.", stepId);
                    randomTasksRequest.getSource().setRanges(new java.util.ArrayList<>());
                }
                if (randomTasksRequest.getSource().getCombinations() != null) {
                    log.warn("Step {} has random-tasks step with combinations field set to {}. " +
                            "Stepik API expects dict, not integer. Removing this field.", 
                            stepId, randomTasksRequest.getSource().getCombinations());
                    randomTasksRequest.getSource().setCombinations(null);
                }
            } else {
                log.warn("Step {} has random-tasks step with missing source. " +
                        "Stepik API requires source with task, solve, and max_error fields. Creating default source.", stepId);
                StepikRandomTasksSourceRequest source = new StepikRandomTasksSourceRequest();
                source.setTask("");
                source.setSolve("");
                source.setMaxError("");
                source.setRanges(new java.util.ArrayList<>());
                source.setCombinations(null);
                randomTasksRequest.setSource(source);
            }
        }
    }

    private void validateAndFixChoiceBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockChoiceRequest choiceRequest) {
            if (choiceRequest.getSource() != null && choiceRequest.getSource().getOptions() != null) {
                Boolean isMultipleChoice = choiceRequest.getSource().getIsMultipleChoice();
                List<StepikChoiceOptionRequest> options = choiceRequest.getSource().getOptions();
                
                long correctCount = options.stream()
                        .filter(option -> option.getIsCorrect() != null && option.getIsCorrect())
                        .count();

                if ((isMultipleChoice == null || !isMultipleChoice) && correctCount > 1) {
                    log.error("Step {} has choice step with {} correct answers but is_multiple_choice is false. " +
                            "Stepik API doesn't allow multiple correct answers in single-choice mode. " +
                            "Keeping only the first correct answer.", stepId, correctCount);
                    
                    boolean firstCorrectFound = false;
                    for (StepikChoiceOptionRequest option : options) {
                        if (option.getIsCorrect() != null && option.getIsCorrect()) {
                            if (!firstCorrectFound) {
                                firstCorrectFound = true;
                            } else {
                                option.setIsCorrect(false);
                            }
                        }
                    }
                }
            }
        }
    }

    private void validateAndFixTableBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockTableRequest tableRequest) {
            if (tableRequest.getSource() != null && tableRequest.getSource().getRows() != null) {
                Boolean isCheckbox = tableRequest.getSource().getOptions() != null 
                        ? tableRequest.getSource().getOptions().getIsCheckbox() : null;
                
                for (int rowIndex = 0; rowIndex < tableRequest.getSource().getRows().size(); rowIndex++) {
                    var row = tableRequest.getSource().getRows().get(rowIndex);
                    if (row.getColumns() == null || row.getColumns().isEmpty()) {
                        continue;
                    }
                    
                    int correctInRow = 0;
                    int firstCorrectIndex = -1;
                    for (int colIndex = 0; colIndex < row.getColumns().size(); colIndex++) {
                        StepikTableCellRequest cell = row.getColumns().get(colIndex);
                        if (cell.getChoice() != null && cell.getChoice()) {
                            if (firstCorrectIndex == -1) {
                                firstCorrectIndex = colIndex;
                            }
                            correctInRow++;
                        }
                    }
                    
                    if ((isCheckbox == null || !isCheckbox) && correctInRow > 1) {
                        log.warn("Step {} row {} has {} correct cells but is_checkbox is false. " +
                                "Keeping only the first correct cell.", stepId, rowIndex, correctInRow);
                        boolean firstFound = false;
                        for (StepikTableCellRequest cell : row.getColumns()) {
                            if (cell.getChoice() != null && cell.getChoice()) {
                                if (firstFound) {
                                    cell.setChoice(false);
                                } else {
                                    firstFound = true;
                                }
                            }
                        }
                    }
                    
                    if (correctInRow == 0) {
                        log.error("Step {} row {} has no correct cells. " +
                                "Stepik API requires at least one correct answer per row. " +
                                "Setting first cell as correct.", stepId, rowIndex);
                        row.getColumns().get(0).setChoice(true);
                    }
                }
            }
        }
    }
}
