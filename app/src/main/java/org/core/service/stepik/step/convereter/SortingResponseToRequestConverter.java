package org.core.service.stepik.step.convereter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.stepik.step.test.sorting.request.StepikBlockSortingRequest;
import org.core.dto.stepik.step.test.sorting.request.StepikSortingOptionRequest;
import org.core.dto.stepik.step.test.sorting.request.StepikSortingSourceRequest;
import org.core.dto.stepik.step.test.sorting.response.StepikBlockSortingResponse;
import org.core.dto.stepik.step.test.sorting.response.StepikSortingOptionResponse;
import org.core.dto.stepik.step.test.sorting.response.StepikSortingSourceResponse;
import org.core.util.CleanerHtmlTags;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class SortingResponseToRequestConverter {

    private final CleanerHtmlTags cleanerTags;

    public StepikBlockSortingRequest convertSortingResponseToRequest(StepikBlockSortingResponse response) {
        StepikBlockSortingRequest request = new StepikBlockSortingRequest();
        request.setText(cleanerTags.cleanHtmlTags(response.getText()));
        request.setVideo(response.getVideo());
        request.setOptions(response.getOptions());

        if (response.getSource() != null) {
            request.setSource(convertSortingSourceResponseToRequest(response.getSource()));
        }
        return request;
    }

    private StepikSortingSourceRequest convertSortingSourceResponseToRequest(StepikSortingSourceResponse response) {
        StepikSortingSourceRequest request = new StepikSortingSourceRequest();
        request.setIsHtmlEnabled(response.getIsHtmlEnabled());

        if (response.getOptions() != null) {
            List<StepikSortingOptionRequest> optionRequests = response.getOptions().stream()
                    .map(this::convertSortingOptionResponseToRequest)
                    .toList();
            request.setOptions(optionRequests);
        }

        return request;
    }

    private StepikSortingOptionRequest convertSortingOptionResponseToRequest(StepikSortingOptionResponse response) {
        StepikSortingOptionRequest request = new StepikSortingOptionRequest();
        request.setText(cleanerTags.cleanHtmlTags(response.getText()));
        return request;
    }

}
