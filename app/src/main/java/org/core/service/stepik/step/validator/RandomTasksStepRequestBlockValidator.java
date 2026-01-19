package org.core.service.stepik.step.validator;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.randomTasks.request.StepikBlockRandomTasksRequest;
import org.core.dto.stepik.step.enterWord.randomTasks.request.StepikRandomTasksSourceRequest;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class RandomTasksStepRequestBlockValidator {

    public void validateAndFixRandomTasksBlock(StepikBlockRequest blockRequest, Long stepId) {
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

}
