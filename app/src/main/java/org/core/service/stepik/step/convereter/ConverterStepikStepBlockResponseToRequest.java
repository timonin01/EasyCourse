package org.core.service.stepik.step.convereter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.StepikBlockResponse;
import org.core.dto.stepik.step.test.choise.response.StepikBlockChoiceResponse;
import org.core.dto.stepik.step.test.matching.response.StepikBlockMatchingResponse;
import org.core.dto.stepik.step.test.sorting.response.StepikBlockSortingResponse;
import org.core.dto.stepik.step.test.table.response.StepikBlockTableResponse;
import org.core.dto.stepik.step.text.StepikBlockTextResponse;
import org.core.exception.StepikStepIntegrationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class ConverterStepikStepBlockResponseToRequest {

    private final TextResponseToRequestConverter textConverter;
    private final ChoiceResponseToRequestConverter choiceConverter;
    private final SortingResponseToRequestConverter sortingConverter;
    private final MatchingResponseToRequestConverter matchingConverter;
    private final TableResponseToRequestConverter tableConverter;

    public StepikBlockRequest convertResponseToRequest(StepikBlockResponse response) {
        if (response instanceof StepikBlockTextResponse textResponse) {
            return textConverter.convertTextResponseToRequest(textResponse);
        } else if (response instanceof StepikBlockChoiceResponse choiceResponse) {
            return choiceConverter.convertChoiceResponseToRequest(choiceResponse);
        } else if (response instanceof StepikBlockSortingResponse sortingResponse) {
            return sortingConverter.convertSortingResponseToRequest(sortingResponse);
        } else if (response instanceof StepikBlockMatchingResponse matchingResponse) {
            return matchingConverter.convertMatchingResponseToRequest(matchingResponse);
        } else if (response instanceof StepikBlockTableResponse tableResponse) {
            return tableConverter.convertTableResponseToRequest(tableResponse);
        } else {
            throw new StepikStepIntegrationException("Unknown block type: " + response.getClass().getSimpleName());
        }
    }

}
