package org.core.service.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.User;
import org.core.domain.ai.BatchGeneration;
import org.core.domain.ai.BatchGenerationStatus;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.ai.BatchGenerationHistoryDTO;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.repository.UserRepository;
import org.core.repository.ai.BatchGenerationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BatchSessionMessageService {

    @Value("${batch.history.limit:50}")
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

    public void markCompleted(Long batchGenerationId, int totalSteps) {
        if (batchGenerationId == null) {
            return;
        }
        batchGenerationRepository.findById(batchGenerationId).ifPresent(batchGeneration -> {
            batchGeneration.setStatus(BatchGenerationStatus.COMPLETED);
            batchGeneration.setTotalSteps(totalSteps);
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

    public void clearBatchGeneration(Long userId, Long batchGenerationId) {
        Optional<BatchGeneration> batchGenerationOptional = batchGenerationRepository.findById(batchGenerationId);
        if (batchGenerationOptional.isEmpty()) {
            return;
        }
        BatchGeneration batchGeneration = batchGenerationOptional.get();
        if (!batchGeneration.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Batch generation does not belong to user");
        }
        batchGenerationRepository.delete(batchGeneration);
    }

    private BatchGenerationHistoryDTO toHistoryDto(BatchGeneration batchGeneration) {
        return BatchGenerationHistoryDTO.builder()
                .id(batchGeneration.getId())
                .userInput(batchGeneration.getUserInput())
                .plan(deserializePlan(batchGeneration.getPlanJson()))
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
}
