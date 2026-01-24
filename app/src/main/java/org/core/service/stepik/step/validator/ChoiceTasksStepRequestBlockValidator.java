package org.core.service.stepik.step.validator;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.test.choise.request.StepikBlockChoiceRequest;
import org.core.dto.stepik.step.test.choise.request.StepikChoiceOptionRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class ChoiceTasksStepRequestBlockValidator {

    public void validateAndFixChoiceBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockChoiceRequest choiceRequest) {
            if (choiceRequest.getSource() != null && choiceRequest.getSource().getOptions() != null) {
                Boolean isMultipleChoice = choiceRequest.getSource().getIsMultipleChoice();
                List<StepikChoiceOptionRequest> options = choiceRequest.getSource().getOptions();

                long correctCount = options.stream()
                        .filter(option -> option.getIsCorrect() != null && option.getIsCorrect())
                        .count();

                if (correctCount > 1 && (isMultipleChoice == null || !isMultipleChoice)) {
                    log.warn("Step {} choice: {} correct answers but is_multiple_choice was false. Setting is_multiple_choice=true.",
                            stepId, correctCount);
                    choiceRequest.getSource().setIsMultipleChoice(true);
                }
            }
        }
    }

}
