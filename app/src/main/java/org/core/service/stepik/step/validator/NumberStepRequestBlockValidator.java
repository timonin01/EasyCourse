package org.core.service.stepik.step.validator;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.number.request.StepikBlockNumberRequest;
import org.core.dto.stepik.step.enterWord.number.request.StepikNumberOptionRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class NumberStepRequestBlockValidator {

    public void validateAndFixNumberBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (blockRequest instanceof StepikBlockNumberRequest numberRequest) {
            if (numberRequest.getSource() != null && numberRequest.getSource().getOptions() != null) {
                List<StepikNumberOptionRequest> options = numberRequest.getSource().getOptions();
                for (int i = 0; i < options.size(); i++) {
                    StepikNumberOptionRequest option = options.get(i);
                    if (option == null) {
                        log.warn("Step {} has null number option[{}]. Creating default option.", stepId, i);
                        option = new StepikNumberOptionRequest();
                        options.set(i, option);
                    }

                    if (option.getZReMin() == null) {
                        log.warn("Step {} has number option[{}] with null z_re_min field. " +
                                "Stepik API REQUIRES this field. Setting to empty string.", stepId, i);
                        option.setZReMin("");
                    }

                    if (option.getIntegerOnly() == null) {
                        log.warn("Step {} has number option[{}] with null integer_only field. " +
                                "Stepik API REQUIRES this field. Setting to false by default.", stepId, i);
                        option.setIntegerOnly(false);
                    }

                    if (option.getMaxError() == null) {
                        log.warn("Step {} has number option[{}] with null max_error field. " +
                                "Stepik API REQUIRES this field. Setting to empty string.", stepId, i);
                        option.setMaxError("");
                    }

                    log.info("Step {} number option[{}] after validation: answer='{}', max_error='{}', z_re_min='{}', integer_only={}",
                            stepId, i, option.getAnswer(), option.getMaxError(), option.getZReMin(), option.getIntegerOnly());
                }
            }
        }
    }

}
