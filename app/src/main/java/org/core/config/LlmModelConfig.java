package org.core.config;

import org.core.enums.LlmModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class LlmModelConfig {

    @Value("${yandex.gpt.api.model-uri}")
    private String yandexGptLiteUri;

    @Value("${yandex.gpt.api.model-uri.qwen}")
    private String qwenUri;

    @Value("${yandex.gpt.api.model-uri.gpt-oss-20b}")
    private String gptOss20bUri;

    @Value("${yandex.gpt.api.model-uri.deepseek-v4-flash}")
    private String deepseekV4FlashUri;

    @Value("${yandex.gpt.api.model-uri.batch}")
    private String yandexGptProUri;

    private Map<LlmModel, String> modelUriMap;

    public String getModelUri(LlmModel model) {
        if (modelUriMap == null) {
            initializeModelUriMap();
        }
        return modelUriMap.get(model);
    }

    private void initializeModelUriMap() {
        modelUriMap = new HashMap<>();
        modelUriMap.put(LlmModel.YANDEX_GPT_LITE, yandexGptLiteUri);
        modelUriMap.put(LlmModel.YANDEX_GPT_PRO, yandexGptProUri);
        modelUriMap.put(LlmModel.QWEN, qwenUri);
        modelUriMap.put(LlmModel.GPT_OSS_20B, gptOss20bUri);
        modelUriMap.put(LlmModel.DEEPSEEK_V4_FLASH, deepseekV4FlashUri);
    }
}
