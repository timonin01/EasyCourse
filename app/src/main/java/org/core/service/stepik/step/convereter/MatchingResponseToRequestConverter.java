package org.core.service.stepik.step.convereter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.stepik.step.test.matching.request.StepikBlockMatchingRequest;
import org.core.dto.stepik.step.test.matching.request.StepikMatchingPairRequest;
import org.core.dto.stepik.step.test.matching.request.StepikMatchingSourceRequest;
import org.core.dto.stepik.step.test.matching.response.StepikBlockMatchingResponse;
import org.core.dto.stepik.step.test.matching.response.StepikMatchingPairResponse;
import org.core.dto.stepik.step.test.matching.response.StepikMatchingSourceResponse;
import org.core.util.CleanerHtmlTags;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class MatchingResponseToRequestConverter {

    private final CleanerHtmlTags cleanerTags;

    public StepikBlockMatchingRequest convertMatchingResponseToRequest(StepikBlockMatchingResponse response) {
        StepikBlockMatchingRequest request = new StepikBlockMatchingRequest();
        request.setText(cleanerTags.cleanHtmlTags(response.getText()));
        request.setVideo(response.getVideo());
        request.setOptions(response.getOptions());

        if (response.getSource() != null) {
            request.setSource(convertMatchingSourceResponseToRequest(response.getSource()));
        }
        return request;
    }

    private StepikMatchingSourceRequest convertMatchingSourceResponseToRequest(StepikMatchingSourceResponse response) {
        StepikMatchingSourceRequest request = new StepikMatchingSourceRequest();
        request.setPreserveFirstsOrder(response.getPreserveFirstsOrder());
        request.setIsHtmlEnabled(response.getIsHtmlEnabled());

        if (response.getPairs() != null) {
            List<StepikMatchingPairRequest> pairRequests = response.getPairs().stream()
                    .map(this::convertMatchingPairResponseToRequest)
                    .toList();
            request.setPairs(pairRequests);
        }

        return request;
    }

    private StepikMatchingPairRequest convertMatchingPairResponseToRequest(StepikMatchingPairResponse response) {
        StepikMatchingPairRequest request = new StepikMatchingPairRequest();
        request.setFirst(cleanerTags.cleanHtmlTags(response.getFirst()));
        request.setSecond(cleanerTags.cleanHtmlTags(response.getSecond()));
        return request;
    }

}
