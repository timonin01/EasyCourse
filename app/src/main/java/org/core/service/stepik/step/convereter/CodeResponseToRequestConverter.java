package org.core.service.stepik.step.convereter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.stepik.step.code.request.StepikBlockCodeRequest;
import org.core.dto.stepik.step.code.request.StepikCodeSourceRequest;
import org.core.dto.stepik.step.code.response.StepikBlockCodeResponse;
import org.core.dto.stepik.step.code.response.StepikCodeSourceResponse;
import org.core.util.CleanerHtmlTags;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class CodeResponseToRequestConverter {

    private final CleanerHtmlTags cleanerTags;

    public StepikBlockCodeRequest convertCodeResponseToRequest(StepikBlockCodeResponse response) {
        StepikBlockCodeRequest request = new StepikBlockCodeRequest();
        request.setText(response.getText() != null ? cleanerTags.cleanHtmlTags(response.getText()) : "");
        request.setVideo(response.getVideo());
        request.setOptions(response.getOptions());

        if (response.getSource() != null) {
            request.setSourceRequest(convertCodeSourceResponseToRequest(response.getSource()));
        }
        return request;
    }

    private StepikCodeSourceRequest convertCodeSourceResponseToRequest(StepikCodeSourceResponse response) {
        StepikCodeSourceRequest request = new StepikCodeSourceRequest();
        request.setAdvancedCodeEditor(response.getCode());
        request.setExecutionTimeLimit(response.getExecutionTimeLimit());
        request.setExecutionMemoryLimit(response.getExecutionMemoryLimit());
        request.setSamplesCount(response.getSamplesCount());
        request.setTemplatesData(response.getTemplatesData());
        request.setIsTimeLimitScaled(response.getIsTimeLimitScaled());
        request.setIsMemoryLimitScaled(response.getIsMemoryLimitScaled());
        request.setIsRunUserCodeAllowed(response.getIsRunUserCodeAllowed());
        request.setManualTimeLimits(response.getManualTimeLimits());
        request.setManualMemoryLimits(response.getManualMemoryLimits());
        request.setTestArchive(response.getTestArchive());
        request.setTestCases(response.getTestCases());
        request.setAreAllTestsRun(response.getAreAllTestsRun());
        return request;
    }
}
