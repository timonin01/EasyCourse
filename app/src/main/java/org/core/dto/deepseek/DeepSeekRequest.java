package org.core.dto.deepseek;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DeepSeekRequest {

    private String model;
    private String prompt;
    private double temperature;
    private int max_tokens;

    @JsonProperty("top_p")
    private double topP;

    public DeepSeekRequest(String model,String prompt) {
        this.model = model;
        this.prompt = prompt;
        this.temperature = 0.7;
        this.max_tokens = 2000;
        this.topP = 0.9;
    }
}
