package org.core.service.agent.course;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Step;
import org.core.domain.StepType;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.core.repository.StepRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LessonTheoryContextService {

    private final StepRepository stepRepository;
    private final ObjectMapper objectMapper;

    public List<StepikBlockRequest> loadTextBlocksFromLesson(Long lessonId) {
        List<Step> steps = stepRepository.findByLessonIdOrderByPositionAsc(lessonId);
        List<StepikBlockRequest> blocks = new ArrayList<>();
        for (Step step : steps) {
            if (step.getType() != StepType.TEXT) {
                continue;
            }
            StepikBlockRequest block = toTextBlock(step);
            if (block != null) {
                blocks.add(block);
            }
        }
        return blocks;
    }

    private StepikBlockRequest toTextBlock(Step step) {
        try {
            if (step.getStepikBlockData() != null && !step.getStepikBlockData().isBlank()) {
                JsonNode node = objectMapper.readTree(step.getStepikBlockData());
                if (node.has("text")) {
                    String text = node.get("text").asText();
                    if (text != null && !text.isBlank()) {
                        StepikBlockTextRequest request = new StepikBlockTextRequest();
                        request.setText(text);
                        return request;
                    }
                }
            }
            if (step.getContent() != null && !step.getContent().isBlank()) {
                StepikBlockTextRequest request = new StepikBlockTextRequest();
                request.setText(step.getContent());
                return request;
            }
        } catch (Exception e) {
            log.warn("Failed to load text block from step {}: {}", step.getId(), e.getMessage());
        }
        return null;
    }
}
