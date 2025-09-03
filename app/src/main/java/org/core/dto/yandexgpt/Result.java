package org.core.dto.yandexgpt;

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
public class Result {
    @JsonProperty("alternatives")
    private List<Alternative> alternatives;
    
    private Usage usage;
    
    @JsonProperty("modelVersion")
    private String modelVersion;
}
