package org.core.service.agent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.service.agent.stepikStepParcer.ChoiceStepParser;
import org.core.service.agent.stepikStepParcer.FreeAnswerStepParser;
import org.core.service.agent.stepikStepParcer.TextStepParser;
import org.core.service.agent.stepikStepParcer.SortingStepParser;
import org.core.service.agent.stepikStepParcer.MatchingStepParser;
import org.core.service.agent.stepikStepParcer.TableStepParser;
import org.core.service.agent.stepikStepParcer.FillBlanksStepParser;
import org.core.service.agent.stepikStepParcer.MathStepParser;
import org.core.service.agent.stepikStepParcer.StringStepParser;
import org.core.service.agent.stepikStepParcer.RandomTasksStepParser;
import org.core.service.agent.stepikStepParcer.NumberStepParser;
import org.core.service.agent.stepikStepParcer.CodeStepParser;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class StepikRequestParser {

    private final ChoiceStepParser choiceStepParser;
    private final TextStepParser textStepParser;
    private final FreeAnswerStepParser freeAnswerStepParser;
    private final SortingStepParser sortingStepParser;
    private final MatchingStepParser matchingStepParser;
    private final TableStepParser tableStepParser;
    private final FillBlanksStepParser fillBlanksStepParser;
    private final MathStepParser mathStepParser;
    private final StringStepParser stringStepParser;
    private final RandomTasksStepParser randomTasksStepParser;
    private final NumberStepParser numberStepParser;
    private final CodeStepParser codeStepParser;

    public StepikBlockRequest parseRequest(String json, String stepType) {
        try {
            return switch (stepType.toLowerCase()) {
                case "choice" -> choiceStepParser.parseChoiceRequest(json);
                case "text" -> textStepParser.parseTextRequest(json);
                case "free-answer" -> freeAnswerStepParser.parseFreeAnswerRequest(json);
                case "sorting" -> sortingStepParser.parseSortingRequest(json);
                case "matching" -> matchingStepParser.parseMatchingRequest(json);
                case "table" -> tableStepParser.parseTableRequest(json);
                case "fill-blanks" -> fillBlanksStepParser.parseFillBlanksRequest(json);
                case "math" -> mathStepParser.parseMathRequest(json);
                case "string" -> stringStepParser.parseStringRequest(json);
                case "random-tasks" -> randomTasksStepParser.parseRandomTasksRequest(json);
                case "number" -> numberStepParser.parseNumberRequest(json);
                case "code" -> codeStepParser.parseCodeRequest(json);
                default -> throw new IllegalArgumentException("Unsupported step type: " + stepType);
            };
        } catch (Exception e) {
            log.error("Failed to parse request for step type {}: {}", stepType, e.getMessage());
            throw new RuntimeException("Invalid request format: " + e.getMessage());
        }
    }
}
