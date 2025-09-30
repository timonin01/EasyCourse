package org.core.service.stepik.step;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Step;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.StepikStepSourceRequestData;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.core.exception.StepikStepIntegrationException;
import org.springframework.stereotype.Component;

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
