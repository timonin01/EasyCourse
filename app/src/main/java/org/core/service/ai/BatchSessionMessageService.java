package org.core.service.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.User;
import org.core.domain.ai.BatchGeneration;
import org.core.domain.ai.BatchGenerationStatus;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.ai.BatchGenerationHistoryDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.repository.UserRepository;
import org.core.repository.ai.BatchGenerationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BatchSessionMessageService {

    @Value("${batch.history.limit}")
    private int batchHistoryLimit;

    private final UserRepository userRepository;
    private final BatchGenerationRepository batchGenerationRepository;
    private final ObjectMapper objectMapper;

    public Long startGeneration(Long userId, String userInput, BatchStepDTO plan, int totalSteps) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User with " + userId + " not found"));
        BatchGeneration batchGeneration = BatchGeneration.builder()
                .user(user)
                .userInput(userInput)
                .planJson(serializePlan(plan))
                .status(BatchGenerationStatus.RUNNING)
                .totalSteps(totalSteps)
                .build();

        return batchGenerationRepository.save(batchGeneration).getId();
    }

    public void markCompleted(Long batchGenerationId, List<StepikBlockRequest> results) {
        if (batchGenerationId == null) {
            return;
        }
        batchGenerationRepository.findById(batchGenerationId).ifPresent(batchGeneration -> {
            batchGeneration.setStatus(BatchGenerationStatus.COMPLETED);
            batchGeneration.setTotalSteps(results != null ? results.size() : 0);
            batchGeneration.setResultsJson(serializeResults(results));
            batchGeneration.setCompletedAt(LocalDateTime.now());
            batchGenerationRepository.save(batchGeneration);
        });
    }

    public void markFailed(Long batchGenerationId, String errorMessage) {
        if (batchGenerationId == null) {
            return;
        }
        batchGenerationRepository.findById(batchGenerationId).ifPresent(batchGeneration -> {
            batchGeneration.setStatus(BatchGenerationStatus.FAILED);
            batchGeneration.setErrorMessage(errorMessage);
            batchGeneration.setCompletedAt(LocalDateTime.now());
            batchGenerationRepository.save(batchGeneration);
        });
    }

    @Transactional(readOnly = true)
    public List<BatchGenerationHistoryDTO> getHistory(Long userId) {
        return batchGenerationRepository
                .findByUser_IdOrderByCreatedAtDesc(userId, PageRequest.of(0, batchHistoryLimit))
                .stream()
                .map(this::toHistoryDto)
                .toList();
    }

    public void clearAllBatchGenerations(Long userId) {
        batchGenerationRepository.deleteAllByUser_Id(userId);
    }

    private BatchGenerationHistoryDTO toHistoryDto(BatchGeneration batchGeneration) {
        return BatchGenerationHistoryDTO.builder()
                .id(batchGeneration.getId())
                .userInput(batchGeneration.getUserInput())
                .plan(deserializePlan(batchGeneration.getPlanJson()))
                .generatedSteps(deserializeResults(batchGeneration.getResultsJson()))
                .status(batchGeneration.getStatus().name())
                .totalSteps(batchGeneration.getTotalSteps())
                .lessonId(batchGeneration.getLesson() != null ? batchGeneration.getLesson().getId() : null)
                .errorMessage(batchGeneration.getErrorMessage())
                .createdAt(batchGeneration.getCreatedAt())
                .completedAt(batchGeneration.getCompletedAt())
                .build();
    }

    private String serializePlan(BatchStepDTO plan) {
        try {
            return objectMapper.writeValueAsString(plan);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize batch plan", e);
        }
    }

    @Nullable
    private BatchStepDTO deserializePlan(@Nullable String planJson) {
        if (planJson == null || planJson.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(planJson, BatchStepDTO.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize batch plan, skipping: {}", e.getMessage());
            return null;
        }
    }

    @Nullable
    private String serializeResults(@Nullable List<StepikBlockRequest> results) {
        if (results == null || results.isEmpty()) {
            return null;
        }
        try {
            return objectMapper
                    .writerFor(new TypeReference<List<StepikBlockRequest>>() {})
                    .writeValueAsString(results);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize batch results, skipping: {}", e.getMessage());
            return null;
        }
    }

    private List<StepikBlockRequest> deserializeResults(@Nullable String resultsJson) {
        if (resultsJson == null || resultsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(resultsJson, new TypeReference<List<StepikBlockRequest>>() {});
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize batch results, skipping: {}", e.getMessage());
            return List.of();
        }
    }
}
