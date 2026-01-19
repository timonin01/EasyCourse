package org.core.service.stepik.step.validator;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.code.request.StepikBlockCodeRequest;
import org.core.dto.stepik.step.code.request.StepikCodeSourceRequest;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CodeTasksStepRequestBlockValidator {

    public void validateAndFixCodeBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockCodeRequest codeRequest && codeRequest.getSourceRequest() != null) {
            StepikCodeSourceRequest src = codeRequest.getSourceRequest();
            if (src.getAdvancedCodeEditor() == null) {
                src.setAdvancedCodeEditor("");
                log.debug("Step {} code block: source.code was null, set to \"\" (Stepik requires key 'code').", stepId);
            }
        }
    }

}
