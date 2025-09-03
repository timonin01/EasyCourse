package org.core.dto.yandexgpt;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Usage {

    @JsonProperty("inputTextTokens")
    private Integer inputTextTokens;
    
    @JsonProperty("completionTokens")
    private Integer completionTokens;
    
    @JsonProperty("totalTokens")
    private Integer totalTokens;
}
