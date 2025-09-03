package org.core.dto.deepseek;

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
public class DeepSeekRequest {

    private String model;
    private List<Message> messages;
    private Double temperature;
    private Integer maxTokens;
    
    @JsonProperty("top_p")
    private Double topP;
    
    private Integer n;
    private Boolean stream;
    private List<String> stop;
    
    @JsonProperty("presence_penalty")
    private Double presencePenalty;
    
    @JsonProperty("frequency_penalty")
    private Double frequencyPenalty;
    
    @JsonProperty("logit_bias")
    private Object logitBias;
    
    private String user;
    
    public DeepSeekRequest(String model, String prompt) {
        this.model = model;
        this.messages = List.of(new Message("user", prompt));
        this.temperature = 0.7;
        this.maxTokens = 2000;
        this.topP = 0.9;
        this.n = 1;
        this.stream = false;
        this.presencePenalty = 0.0;
        this.frequencyPenalty = 0.0;
    }
}
