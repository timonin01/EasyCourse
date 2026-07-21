package org.core.dto.stepik.step.video.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.video.StepikVideoSource;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StepikBlockVideoRequest implements StepikBlockRequest {

    private String text;
    private StepikVideoSource video;
    private Object options;

}
