package org.core.dto.ai.yandexgpt;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class YandexGptResponse {

    private Result result;
    
    private Error error;
}
