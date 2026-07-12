package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.Step;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.course.CourseAgentAction;
import org.core.dto.agent.course.CourseAgentResponse;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.step.UpdateStepDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.core.enums.LlmModel;
import org.core.service.agent.StepContentModifier;
import org.core.service.agent.StepikRequestParser;
import org.core.service.crud.StepService;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseStepModificationService {

    private final CourseEntityResolver entityResolver;
    private final StepContentModifier stepContentModifier;
    private final StepikRequestParser stepikRequestParser;
    private final StepService stepService;
    private final CourseStepTypeMapper stepTypeMapper;
    private final CoursePlanValidator planValidator;
    private final UserAccessService userAccessService;

    public CourseAgentResponse modifyById(Long courseId, Long userId, Long stepId, String sessionId,
                                          String userInput, LlmModel llmModel,
                                          List<ChatMessage> history) {
        Step step = userAccessService.findStepAndVerifyOwner(userId, stepId);
        planValidator.verifyCourse(
                courseId,
                step.getLesson().getSection().getCourse().getId());
        return modifyInternal(stepId, sessionId, userInput, llmModel, history);
    }

    private CourseAgentResponse modifyInternal(Long stepId, String sessionId,
                                               String userInput, LlmModel llmModel,
                                               List<ChatMessage> history) {
        StepResponseDTO stepDto = stepService.getStepById(stepId);
        Optional<String> typeString = stepTypeMapper.toStringType(stepDto.getType());
        if (typeString.isEmpty()) {
            return CourseAgentResponse.error(
                    "Тип шага " + stepDto.getType() + " пока не поддерживается для авто-правки.");
        }

        String blockJson = stepDto.getStepikBlockData();
        if (blockJson == null || blockJson.isBlank()) {
            return CourseAgentResponse.error("У шага нет данных блока для изменения.");
        }

        try {
            StepikBlockRequest previous = stepikRequestParser.parseRequest(blockJson, typeString.get());
            StepikBlockRequest modified = stepContentModifier.modifyStepContent(
                    sessionId, userInput, typeString.get(), previous, llmModel, history);

            UpdateStepDTO update = new UpdateStepDTO();
            update.setStepId(stepId);
            update.setType(stepDto.getType());
            update.setStepikBlock(modified);
            if (modified instanceof StepikBlockTextRequest textRequest) {
                update.setContent(textRequest.getText());
            }
            stepService.updateStep(update);

            return CourseAgentResponse.builder()
                    .action(CourseAgentAction.STEP_MODIFIED)
                    .message("Шаг обновлён. Проверьте результат и синхронизируйте со Stepik вручную.")
                    .step(stepService.getStepById(stepId))
                    .build();
        } catch (Exception e) {
            log.error("Failed to modify step {}: {}", stepId, e.getMessage(), e);
            return CourseAgentResponse.error("Не удалось изменить шаг: " + e.getMessage());
        }
    }
}
