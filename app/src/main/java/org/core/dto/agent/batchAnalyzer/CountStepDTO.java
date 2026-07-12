package org.core.dto.agent.batchAnalyzer;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CountStepDTO {

    @JsonProperty("type")
    private String type;

    @JsonProperty("count")
    private Integer count;

    @JsonProperty("specificInput")
    private String specificInput;

    @JsonProperty("useSummarizedEnabled")
    @JsonAlias("useTextContext")
    private Boolean useSummarizedEnabled;
}
