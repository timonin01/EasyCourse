package org.core.service.stepik.step.validator;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.math.request.StepikBlockMathRequest;
import org.core.dto.stepik.step.enterWord.math.request.StepikMathNumericalTestRequest;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MathStepRequestBlockValidator {

    private static final String DEFAULT_MAX_ERROR = "1e-06";
    private static final String BOUND_MIN = "-1e308";
    private static final String BOUND_MAX = "1e308";

    public void validateAndFixMathBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (!(blockRequest instanceof StepikBlockMathRequest mathRequest)) {
            return;
        }
        if (mathRequest.getSource() == null) {
            return;
        }
        StepikMathNumericalTestRequest nt = mathRequest.getSource().getNumerical_test();
        if (nt == null) {
            nt = new StepikMathNumericalTestRequest();
            mathRequest.getSource().setNumerical_test(nt);
            log.warn("Step {} math: numerical_test was null. Created default.", stepId);
        }

        if (nt.getZReMin() == null || nt.getZReMin().isBlank()) {
            log.warn("Step {} math: z_re_min missing. Stepik requires a numeric string. Setting to {}.", stepId, BOUND_MIN);
            nt.setZReMin(BOUND_MIN);
        }
        if (nt.getZReMax() == null || nt.getZReMax().isBlank()) {
            nt.setZReMax(BOUND_MAX);
        }
        if (nt.getZImMin() == null || nt.getZImMin().isBlank()) {
            nt.setZImMin(BOUND_MIN);
        }
        if (nt.getZImMax() == null || nt.getZImMax().isBlank()) {
            nt.setZImMax(BOUND_MAX);
        }
        if (nt.getMaxError() == null || nt.getMaxError().isBlank()) {
            nt.setMaxError(DEFAULT_MAX_ERROR);
        }
        if (nt.getIntegerOnly() == null) {
            nt.setIntegerOnly(false);
        }
    }
}
