package org.core.service.stepik.step.convereter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.stepik.step.video.request.StepikBlockVideoRequest;
import org.core.dto.stepik.step.video.response.StepikBlockVideoResponse;
import org.core.util.CleanerHtmlTags;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class VideoResponseToRequestConverter {

    private final CleanerHtmlTags cleanerTags;

    public StepikBlockVideoRequest convertVideoResponseToRequest(StepikBlockVideoResponse response) {
        StepikBlockVideoRequest request = new StepikBlockVideoRequest();
        request.setText(response.getText() != null ? cleanerTags.cleanHtmlTags(response.getText()) : null);
        request.setVideo(response.getVideo());
        request.setOptions(response.getOptions());
        return request;
    }

}
