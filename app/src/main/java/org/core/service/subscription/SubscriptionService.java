package org.core.service.subscription;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.ai.AiUsage;
import org.core.domain.User;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.subscription.SubscriptionStatusDTO;
import org.core.enums.LlmModel;
import org.core.enums.UserRole;
import org.core.exception.exceptions.SubscriptionLimitExceededException;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.repository.AiUsageRepository;
import org.core.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SubscriptionService {

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    @Value("${subscription.free.ai-limit}")
    private int freeAiLimit;

    @Value("${subscription.free.max-batch-steps}")
    private int freeMaxBatchSteps;

    @Value("${subscription.pro.max-batch-steps}")
    private int proMaxBatchSteps;

    private final UserRepository userRepository;
    private final AiUsageRepository aiUsageRepository;

    @Transactional(readOnly = true)
    public SubscriptionStatusDTO getStatus(Long userId) {
        User user = findUser(userId);
        int used = getUsedCount(userId);
        boolean pro = isPro(user);

        return SubscriptionStatusDTO.builder()
                .role(user.getRole())
                .pro(pro)
                .aiUsed(used)
                .aiLimit(pro ? null : freeAiLimit)
                .maxBatchSteps(pro ? proMaxBatchSteps : freeMaxBatchSteps)
                .canChangeStepType(pro)
                .canSelectModel(pro)
                .build();
    }

    @Transactional(readOnly = true)
    public boolean isPro(Long userId) {
        return isPro(findUser(userId));
    }

    @Transactional(readOnly = true)
    public int getMaxBatchSteps(Long userId) {
        return isPro(userId) ? proMaxBatchSteps : freeMaxBatchSteps;
    }

    public void validateModelAccess(Long userId, LlmModel llmModel) {
        if (llmModel == null) {
            return;
        }
        if (!isPro(userId)) {
            throw new SubscriptionLimitExceededException("Выбор модели доступен в подписке Pro. На бесплатном тарифе доступна только Auto.");
        }
    }

    public void validateAiGenerationAllowed(Long userId, int units) {
        if (isPro(userId)) {
            return;
        }
        int used = getUsedCount(userId);
        if (used + units > freeAiLimit) {
            throw new SubscriptionLimitExceededException(String.format(
                    "Лимит AI-генераций исчерпан (%d/%d в этом месяце). Оформите Pro для безлимитного доступа.",
                    used,
                    freeAiLimit
            ));
        }
    }

    public void validateBatchPlan(Long userId, BatchStepDTO batchStepDTO) {
        int totalSteps = countBatchSteps(batchStepDTO);
        int maxBatchSteps = getMaxBatchSteps(userId);
        if (totalSteps > maxBatchSteps) {
            if (isPro(userId)) {
                throw new SubscriptionLimitExceededException(String.format(
                        "Максимум %d шагов за одну batch-генерацию. В плане: %d.",
                        maxBatchSteps,
                        totalSteps
                ));
            }
            throw new SubscriptionLimitExceededException(String.format(
                    "На бесплатном тарифе batch-генерация до %d шагов. В плане: %d. Оформите Pro для batch до %d шагов.",
                    maxBatchSteps,
                    totalSteps,
                    proMaxBatchSteps
            ));
        }
        validateAiGenerationAllowed(userId, totalSteps);
    }

    public void validateStepTypeChangeAllowed(Long userId) {
        if (!isPro(userId)) {
            throw new SubscriptionLimitExceededException(
                    "Конвертация типа с помощью AI доступна в подписке Pro.");
        }
        validateAiGenerationAllowed(userId, 1);
    }

    public void recordAiUsage(Long userId, int units) {
        if (units <= 0 || isPro(userId)) {
            return;
        }
        String month = currentMonth();
        AiUsage usage = aiUsageRepository.findByUserIdAndUsageMonth(userId, month)
                .orElseGet(() -> AiUsage.builder()
                        .user(findUser(userId))
                        .usageMonth(month)
                        .usedCount(0)
                        .build());

        usage.setUsedCount(usage.getUsedCount() + units);
        aiUsageRepository.save(usage);
        log.debug("Recorded {} AI usage units for user {} in {}", units, userId, month);
    }

    private int getUsedCount(Long userId) {
        return aiUsageRepository.findByUserIdAndUsageMonth(userId, currentMonth())
                .map(AiUsage::getUsedCount)
                .orElse(0);
    }

    private boolean isPro(User user) {
        return user.getRole() == UserRole.PRO;
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User was not found"));
    }

    private String currentMonth() {
        return LocalDate.now().format(MONTH_FORMAT);
    }

    public static int countBatchSteps(BatchStepDTO batchStepDTO) {
        if (batchStepDTO == null || batchStepDTO.getSteps() == null) {
            return 0;
        }
        return batchStepDTO.getSteps().stream()
                .mapToInt(step -> step.getCount() == null || step.getCount() < 1 ? 1 : step.getCount())
                .sum();
    }
}
