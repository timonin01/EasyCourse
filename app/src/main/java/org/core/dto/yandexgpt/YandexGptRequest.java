package org.core.dto.yandexgpt;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class YandexGptRequest {

    @JsonProperty("modelUri")
    private String modelUri;

    @JsonProperty("completionOptions")
    private CompletionOptions completionOptions;

    private List<Message> messages;

    @JsonProperty("json_object")
    private Boolean jsonObject;

    public YandexGptRequest(String modelUri, List<Message> messages, Boolean jsonObject) {
        this.modelUri = modelUri;
        this.messages = messages;
        this.completionOptions = new CompletionOptions();
        this.jsonObject = jsonObject;
    }

    public void setMaxTokens(int maxTokens) {
        if (this.completionOptions == null) {
            this.completionOptions = new CompletionOptions();
        }
        this.completionOptions.setMaxTokens(maxTokens);
    }
}
