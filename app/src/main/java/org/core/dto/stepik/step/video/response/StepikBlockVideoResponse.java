package org.core.dto.stepik.step.video.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.StepikBlockResponse;
import org.core.dto.stepik.step.video.StepikVideoSource;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class StepikBlockVideoResponse implements StepikBlockResponse {

    private String name;
    private String text;
    private StepikVideoSource video;
    private Object options;

}
