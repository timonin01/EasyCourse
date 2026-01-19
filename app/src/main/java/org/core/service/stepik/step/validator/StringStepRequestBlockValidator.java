package org.core.service.stepik.step.validator;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.string.request.StepikBlockStringRequest;
import org.core.dto.stepik.step.enterWord.string.request.StepikStringSourceRequest;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class StringStepRequestBlockValidator {

    public void validateAndFixStringBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockStringRequest stringRequest) {
            if (stringRequest.getSource() != null) {
                if (stringRequest.getSource().getCode() == null || stringRequest.getSource().getCode().trim().isEmpty()) {
                    log.error("Step {} has string step with missing or empty code field. " +
                            "Stepik API requires this field. Setting default empty string.", stepId);
                    stringRequest.getSource().setCode("");
                }
            } else {
                log.error("Step {} has string step with missing source. " +
                        "Stepik API requires source with code field. Creating default source.", stepId);
                StepikStringSourceRequest source = new StepikStringSourceRequest();
                source.setCode("");
                stringRequest.setSource(source);
            }
        }
    }

}
