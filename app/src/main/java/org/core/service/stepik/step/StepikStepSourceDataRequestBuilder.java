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
import org.core.dto.stepik.step.enterWord.string.request.StepikBlockStringRequest;
import org.core.dto.stepik.step.enterWord.number.request.StepikBlockNumberRequest;
import org.core.dto.stepik.step.enterWord.number.request.StepikNumberOptionRequest;
import org.core.dto.stepik.step.enterWord.randomTasks.request.StepikBlockRandomTasksRequest;
import org.core.dto.stepik.step.code.request.StepikBlockCodeRequest;
import org.core.dto.stepik.step.code.request.StepikCodeSourceRequest;
import org.core.dto.stepik.step.test.choise.request.StepikBlockChoiceRequest;
import org.core.dto.stepik.step.test.choise.request.StepikChoiceOptionRequest;
import org.core.dto.stepik.step.test.table.request.StepikBlockTableRequest;
import org.core.dto.stepik.step.test.table.request.StepikTableCellRequest;
import org.core.exception.exceptions.StepikStepIntegrationException;
import org.core.service.stepik.step.validator.*;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikStepSourceDataRequestBuilder {

    private final ObjectMapper objectMapper;

    private final FillBlanksStepRequestBlockValidator fillBlanksValidator;
    private final StringStepRequestBlockValidator stringValidator;
    private final NumberStepRequestBlockValidator numberValidator;
    private final RandomTasksStepRequestBlockValidator randomTasksValidator;
    private final ChoiceTasksStepRequestBlockValidator choiceValidator;
    private final TableTasksStepRequestBlockValidator tableValidator;
    private final CodeTasksStepRequestBlockValidator codeValidator;
    private final MatchingTasksStepRequestBlockValidator matchingValidator;
    private final MathStepRequestBlockValidator mathValidator;

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

                fillBlanksValidator.validateAndFixFillBlanksBlock(stepikBlockRequest, step.getId());
                stringValidator.validateAndFixStringBlock(stepikBlockRequest, step.getId());
                numberValidator.validateAndFixNumberBlock(stepikBlockRequest, step.getId());
                randomTasksValidator.validateAndFixRandomTasksBlock(stepikBlockRequest, step.getId());
                choiceValidator.validateAndFixChoiceBlock(stepikBlockRequest, step.getId());
                tableValidator.validateAndFixTableBlock(stepikBlockRequest, step.getId());
                codeValidator.validateAndFixCodeBlock(stepikBlockRequest, step.getId());
                matchingValidator.validateAndFixMatchingBlock(stepikBlockRequest, step.getId());
                mathValidator.validateAndFixMathBlock(stepikBlockRequest, step.getId());

                if (stepikBlockRequest instanceof StepikBlockFillBlanksRequest fillBlanks) {
                    if (fillBlanks.getSource() != null && fillBlanks.getSource().getComponents() != null) {
                        for (int i = 0; i < fillBlanks.getSource().getComponents().size(); i++) {
                            var comp = fillBlanks.getSource().getComponents().get(i);
                            log.error("Step {} fill-blanks component[{}] FINAL STATE: type='{}', text='{}', optionsCount={}", 
                                    step.getId(), i, comp.getType(), 
                                    comp.getText() != null ? comp.getText().substring(0, Math.min(50, comp.getText().length())) : "null",
                                    comp.getOptions() != null ? comp.getOptions().size() : 0);
                        }
                    }
                }
                
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

                fillBlanksValidator.validateAndFixFillBlanksBlock(stepikBlockRequest, step.getId());
                stringValidator.validateAndFixStringBlock(stepikBlockRequest, step.getId());
                numberValidator.validateAndFixNumberBlock(stepikBlockRequest, step.getId());
                randomTasksValidator.validateAndFixRandomTasksBlock(stepikBlockRequest, step.getId());
                choiceValidator.validateAndFixChoiceBlock(stepikBlockRequest, step.getId());
                tableValidator.validateAndFixTableBlock(stepikBlockRequest, step.getId());
                codeValidator.validateAndFixCodeBlock(stepikBlockRequest, step.getId());
                matchingValidator.validateAndFixMatchingBlock(stepikBlockRequest, step.getId());
                mathValidator.validateAndFixMathBlock(stepikBlockRequest, step.getId());

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

}
