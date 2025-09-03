package org.core.dto.yandexgpt;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CompletionOptions {

    @JsonProperty("stream")
    private Boolean stream;

    @JsonProperty("temperature")
    private Double temperature;

    @JsonProperty("maxTokens")
    private Integer maxTokens;

    public CompletionOptions() {
        this.stream = false;
        this.temperature = 0.6;
        this.maxTokens = 2000;
    }
}
