package org.core.service.stepik.step;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Step;
import org.core.domain.StepType;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.step.UpdateStepDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.exception.exceptions.StepNotFoundException;
import org.core.repository.StepRepository;
import org.core.service.agent.AgentService;
import org.core.service.crud.StepService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class StepTypeChangeService {

    private final ObjectMapper objectMapper;

    private final AgentService agentService;
    private final StepRepository stepRepository;
    private final StepService stepService;
    private final StepikStepService stepikStepService;

    public StepResponseDTO changeStepType(Long stepId, StepType newType, String sessionId) {
        log.info("Starting change stepType for stepId: {}, and newStepType: {}", stepId, newType);
        StepResponseDTO stepResponseDTO = stepService.getStepById(stepId);
        StepType oldStepType = stepResponseDTO.getType();

        if (newType.equals(oldStepType)) {
            return stepResponseDTO;
        }

        Long stepikStepId = stepResponseDTO.getStepikStepId();
        boolean isStepikStepIdExist = stepikStepId != null;
        if (isStepikStepIdExist) {
            stepikStepService.deleteStep(stepikStepId);

            Step step = getStepByStepId(stepId);
            step.setStepikStepId(null);
            stepRepository.save(step);
        }

        String content = getContentForNewStep(stepResponseDTO);
        if (content == null || content.trim().isEmpty()) {
            log.error("Content is null or empty for stepId: {}", stepId);
            throw new IllegalArgumentException("Нельзя изменить тип шага без текста. Сначала добавьте текст/вопрос в шаг.");
        }
        String correctStepType = convertStepTypeToBlockName(newType);

        StepikBlockRequest newStepikBlockRequest;
        try {
            newStepikBlockRequest = agentService.generateStep(sessionId, content, correctStepType);
        } catch (Exception e) {
            log.error("Failed to generate step via AI for stepId: {}, newType: {}", stepId, newType, e);
            throw new RuntimeException("Не удалось сгенерировать шаг через AI: " + e.getMessage(), e);
        }

        String newContent = extractTextFromStepikBlockRequest(newStepikBlockRequest);
        if (newContent == null || newContent.trim().isEmpty()) {
            newContent = content;
        }

        UpdateStepDTO updateStepDTO = new UpdateStepDTO();
        updateStepDTO.setStepId(stepId);
        updateStepDTO.setType(newType);
        updateStepDTO.setStepikBlock(newStepikBlockRequest);
        updateStepDTO.setStepikStepId(null);
        updateStepDTO.setCost(stepResponseDTO.getCost());
        updateStepDTO.setContent(newContent);
        updateStepDTO.setPosition(stepResponseDTO.getPosition());

        return stepService.updateStep(updateStepDTO);
    }

    private Step getStepByStepId(Long stepId) {
        return stepRepository.findById(stepId)
                .orElseThrow(() -> new StepNotFoundException("Step not found"));
    }

    private String convertStepTypeToBlockName(StepType stepType) {
        return switch (stepType) {
            case TEXT -> "text";
            case CHOICE -> "choice";
            case MATCHING -> "matching";
            case SORTING -> "sorting";
            case TABLE -> "table";
            case FILL_BLANK -> "fill-blanks";
            case STRING -> "string";
            case NUMBER -> "number";
            case FREE_ANSWER -> "free-answer";
            case MATH -> "math";
            case RANDOM_TASKS -> "random-tasks";
            case CODE -> "code";
            default -> throw new IllegalArgumentException("Unknow stepType" + stepType);
        };
    }

    private String getContentForNewStep(StepResponseDTO stepResponseDTO) {
        log.info("Extracting content for stepId: {}", stepResponseDTO.getId());
        String contentInDB = stepResponseDTO.getContent();
        if (contentInDB != null && !contentInDB.trim().isEmpty()) {
            return contentInDB;
        }
        
        String stepikBlockData = stepResponseDTO.getStepikBlockData();
        if (stepikBlockData != null && !stepikBlockData.trim().isEmpty()) {
            try {
                String contentInStepikBlock = extractContentFromStepikBlock(stepikBlockData);
                if (contentInStepikBlock != null && !contentInStepikBlock.trim().isEmpty()) {
                    return contentInStepikBlock;
                }
            } catch (RuntimeException | JsonProcessingException e) {
                log.error("Failed to extract text from stepikBlockData for stepId: {}, error: {}", stepResponseDTO.getId(), e.getMessage());
            }
        }
        
        return null;
    }

    private String extractContentFromStepikBlock(String stepikBlockData) throws JsonProcessingException {
        if (stepikBlockData == null || stepikBlockData.isEmpty()) {
            log.error("StepikBlockData is null or empty");
            return null;
        }
        JsonNode jsonNode = objectMapper.readTree(stepikBlockData);
        JsonNode textNode = jsonNode.get("text");
        if (textNode == null || textNode.isNull()) {
            log.error("text field not found or is null in StepikBlockData");
            return null;
        }
        String text = textNode.asText();
        if (text == null || text.trim().isEmpty()) {
            log.error("text field is empty in StepikBlockData");
            return null;
        }
        
        return text;
    }

    private String extractTextFromStepikBlockRequest(StepikBlockRequest blockRequest) {
        try {
            String json = objectMapper.writeValueAsString(blockRequest);
            JsonNode jsonNode = objectMapper.readTree(json);
            if (jsonNode.has("text") && !jsonNode.get("text").isNull()) {
                String text = jsonNode.get("text").asText();
                if (text != null && !text.trim().isEmpty()) {
                    return text;
                }
            }
            log.info("text field not found or empty in StepikBlockRequest");
        } catch (Exception e) {
            log.error("Failed to extract text from StepikBlockRequest: {}", e.getMessage());
        }
        return null;
    }

}
