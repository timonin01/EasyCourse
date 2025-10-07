package org.core.service.stepik.step.convereter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.core.dto.stepik.step.text.StepikBlockTextResponse;
import org.core.util.CleanerHtmlTags;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class TextResponseToRequestConverter {

    private final CleanerHtmlTags cleanerTags;

    public StepikBlockTextRequest convertTextResponseToRequest(StepikBlockTextResponse response) {
        StepikBlockTextRequest request = new StepikBlockTextRequest();
        request.setText(cleanerTags.cleanHtmlTags(response.getText()));
        request.setVideo(response.getVideo());
        request.setOptions(response.getOptions());
        return request;
    }

}
