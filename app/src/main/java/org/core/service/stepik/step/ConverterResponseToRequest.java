package org.core.service.stepik.step;

import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.StepikBlockResponse;
import org.core.dto.stepik.step.choise.request.StepikBlockChoiceRequest;
import org.core.dto.stepik.step.choise.request.StepikChoiceOptionRequest;
import org.core.dto.stepik.step.choise.request.StepikChoiceSourceRequest;
import org.core.dto.stepik.step.choise.response.StepikBlockChoiceResponse;
import org.core.dto.stepik.step.choise.response.StepikChoiceOptionResponse;
import org.core.dto.stepik.step.choise.response.StepikChoiceSourceResponse;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.core.dto.stepik.step.text.StepikBlockTextResponse;
import org.core.exception.StepikStepIntegrationException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConverterResponseToRequest {

    public StepikBlockRequest convertResponseToRequest(StepikBlockResponse response) {
        if (response instanceof StepikBlockTextResponse textResponse) {
            return convertTextResponseToRequest(textResponse);
        } else if (response instanceof StepikBlockChoiceResponse choiceResponse) {
            return convertChoiceResponseToRequest(choiceResponse);
        } else {
            throw new StepikStepIntegrationException("Unknown block type: " + response.getClass().getSimpleName());
        }
    }

    private StepikBlockTextRequest convertTextResponseToRequest(StepikBlockTextResponse response) {
        StepikBlockTextRequest request = new StepikBlockTextRequest();
        request.setText(cleanHtmlTags(response.getText()));
        request.setVideo(response.getVideo());
        request.setOptions(response.getOptions());
        return request;
    }

    private StepikBlockChoiceRequest convertChoiceResponseToRequest(StepikBlockChoiceResponse response) {
        StepikBlockChoiceRequest request = new StepikBlockChoiceRequest();
        request.setText(cleanHtmlTags(response.getText()));
        request.setVideo(response.getVideo());
        request.setOptions(response.getOptions());
        request.setIsDeprecated(response.getIsDeprecated());
        request.setSubtitleFiles(response.getSubtitleFiles());
        request.setSubtitles(response.getSubtitles());
        request.setTestsArchive(response.getTestsArchive());
        request.setFeedbackCorrect(cleanHtmlTags(response.getFeedbackCorrect()));
        request.setFeedbackWrong(cleanHtmlTags(response.getFeedbackWrong()));

        if (response.getSource() != null) {
            request.setSource(convertChoiceSourceResponseToRequest(response.getSource()));
        }
        return request;
    }

    private StepikChoiceSourceRequest convertChoiceSourceResponseToRequest(StepikChoiceSourceResponse response) {
        StepikChoiceSourceRequest request = new StepikChoiceSourceRequest();
        request.setIsMultipleChoice(response.getIsMultipleChoice());
        request.setIsAlwaysCorrect(response.getIsAlwaysCorrect());
        request.setSampleSize(response.getSampleSize());
        request.setPreserveOrder(response.getPreserveOrder());
        request.setIsHtmlEnabled(response.getIsHtmlEnabled());
        request.setIsOptionsFeedback(response.getIsOptionsFeedback());

        if (response.getOptions() != null) {
            List<StepikChoiceOptionRequest> optionRequests = response.getOptions().stream()
                    .map(this::convertChoiceOptionResponseToRequest)
                    .toList();
            request.setOptions(optionRequests);
        }

        return request;
    }

    private StepikChoiceOptionRequest convertChoiceOptionResponseToRequest(StepikChoiceOptionResponse response) {
        StepikChoiceOptionRequest request = new StepikChoiceOptionRequest();
        request.setIsCorrect(response.getIsCorrect());
        request.setText(cleanHtmlTags(response.getText())); 
        request.setFeedback(cleanHtmlTags(response.getFeedback())); 
        return request;
    }

    public String cleanHtmlTags(String htmlText) {
        if (htmlText == null || htmlText.trim().isEmpty()) {
            return htmlText;
        }
        String cleanText = htmlText.replaceAll("<[^>]+>", "");
        cleanText = cleanText.replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&nbsp;", " ");

        cleanText = cleanText.replaceAll("\\s+", " ").trim();
        return cleanText;
    }

}
