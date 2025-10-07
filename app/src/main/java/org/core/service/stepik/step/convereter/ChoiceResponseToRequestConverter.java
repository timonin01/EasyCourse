package org.core.service.stepik.step.convereter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.stepik.step.test.choise.request.StepikBlockChoiceRequest;
import org.core.dto.stepik.step.test.choise.request.StepikChoiceOptionRequest;
import org.core.dto.stepik.step.test.choise.request.StepikChoiceSourceRequest;
import org.core.dto.stepik.step.test.choise.response.StepikBlockChoiceResponse;
import org.core.dto.stepik.step.test.choise.response.StepikChoiceOptionResponse;
import org.core.dto.stepik.step.test.choise.response.StepikChoiceSourceResponse;
import org.core.util.CleanerHtmlTags;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class ChoiceResponseToRequestConverter {

    private final CleanerHtmlTags cleanerTags;

    public StepikBlockChoiceRequest convertChoiceResponseToRequest(StepikBlockChoiceResponse response) {
        StepikBlockChoiceRequest request = new StepikBlockChoiceRequest();
        request.setText(cleanerTags.cleanHtmlTags(response.getText()));
        request.setVideo(response.getVideo());
        request.setOptions(response.getOptions());

        if (response.getSource() != null) {
            request.setSource(convertChoiceSourceResponseToRequest(response.getSource()));
        }
        return request;
    }

    private StepikChoiceSourceRequest convertChoiceSourceResponseToRequest(StepikChoiceSourceResponse response) {
        StepikChoiceSourceRequest request = new StepikChoiceSourceRequest();
        request.setIsHtmlEnabled(response.getIsHtmlEnabled());

        if (response.getOptions() != null) {
            List<StepikChoiceOptionRequest> optionRequests = response.getOptions().stream()
                    .map(this::convertChoiceOptionResponseToRequest)
                    .toList();
            request.setOptions(optionRequests);
        }

        return request;
    }

    private StepikChoiceOptionRequest convertChoiceOptionResponseToRequest(StepikChoiceOptionResponse response) {
        StepikChoiceOptionRequest request = new StepikChoiceOptionRequest();
        request.setText(cleanerTags.cleanHtmlTags(response.getText()));
        return request;
    }

}
