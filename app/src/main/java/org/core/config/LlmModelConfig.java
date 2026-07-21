package org.core.config;

import org.core.enums.LlmModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class LlmModelConfig {

    @Value("${provod.api.model-name.default}")
    private String defaultModel;

    @Value("${provod.api.model-name.deepseek-v4-flash}")
    private String deepseekV4FlashModel;

    @Value("${provod.api.model-name.deepseek-v4-pro}")
    private String deepseekV4ProModel;

    @Value("${provod.api.model-name.claude-sonnet-4.6}")
    private String claudeSonnetModel;

    @Value("${provod.api.model-name.z-ai}")
    private String zAiModel;

    @Value("${provod.api.model-name.qwen3.7-max}")
    private String qwen37MaxModel;

    @Value("${provod.api.model-name.gemini-3-1-flash}")
    private String gemini31FlashModel;

    @Value("${provod.api.model-name.gemini-3.5-flash}")
    private String gemini35FlashModel;

    @Value("${provod.api.model-name.grok-4.1-fast}")
    private String grok41FastModel;

    @Value("${provod.api.model-name.grok-4.5}")
    private String grok45Model;

    @Value("${provod.api.model-name.mimo-v2.5-pro}")
    private String mimo25ProModel;

    private Map<LlmModel, String> modelUriMap;

    public String getModelUri(LlmModel model) {
        if (model == null) {
            return defaultModel;
        }
        if (modelUriMap == null) {
            initializeModelUriMap();
        }
        return modelUriMap.getOrDefault(model, defaultModel);
    }

    public String getDefaultModelUri() {
        return defaultModel;
    }

    private void initializeModelUriMap() {
        modelUriMap = new HashMap<>();
        modelUriMap.put(LlmModel.YANDEX_GPT_LITE, defaultModel);
        modelUriMap.put(LlmModel.YANDEX_GPT_PRO, claudeSonnetModel);
        modelUriMap.put(LlmModel.QWEN, qwen37MaxModel);
        modelUriMap.put(LlmModel.GPT_OSS_20B, zAiModel);
        modelUriMap.put(LlmModel.DEEPSEEK_V4_FLASH, deepseekV4FlashModel);
        modelUriMap.put(LlmModel.DEEPSEEK_V4_PRO, deepseekV4ProModel);
        modelUriMap.put(LlmModel.SONNET_4_6, claudeSonnetModel);
        modelUriMap.put(LlmModel.Z_AI_GLM_5_2, zAiModel);
        modelUriMap.put(LlmModel.QWEN_3_7_MAX, qwen37MaxModel);
        modelUriMap.put(LlmModel.GEMINI_3_1_FLASH, gemini31FlashModel);
        modelUriMap.put(LlmModel.GEMINI_3_5_FLASH, gemini35FlashModel);
        modelUriMap.put(LlmModel.GROK_4_1_FAST, grok41FastModel);
        modelUriMap.put(LlmModel.GROK_4_5, grok45Model);
        modelUriMap.put(LlmModel.MIMO_2_5_PRO, mimo25ProModel);
    }
}
