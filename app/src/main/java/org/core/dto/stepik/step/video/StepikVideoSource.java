package org.core.dto.stepik.step.video;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class StepikVideoSource {

    private Long id;
    private String thumbnail;
    private List<StepikVideoUrl> urls;
    private Integer duration;
    private String status;

    @JsonProperty("upload_date")
    private String uploadDate;

    private String filename;

}
