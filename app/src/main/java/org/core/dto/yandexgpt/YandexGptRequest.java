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
public class YandexGptRequest {

    @JsonProperty("modelUri")
    private String modelUri;

    private List<Message> messages;

    @JsonProperty("maxTokens")
    private Integer maxTokens;

    private Double temperature;

    public YandexGptRequest(String modelUri, String text) {
        this.modelUri = modelUri;
        this.messages = List.of(new Message("user", text));
        this.maxTokens = 2000;
        this.temperature = 0.6;
    }
}
