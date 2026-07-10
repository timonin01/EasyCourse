package org.core.service.agent.course;

import org.core.domain.StepType;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

//TODO отрефакторить
@Component
public class CourseStepTypeMapper {

    private static final Map<String, StepType> STRING_TO_ENUM = Map.ofEntries(
            Map.entry("text", StepType.TEXT),
            Map.entry("choice", StepType.CHOICE),
            Map.entry("matching", StepType.MATCHING),
            Map.entry("sorting", StepType.SORTING),
            Map.entry("table", StepType.TABLE),
            Map.entry("fill-blanks", StepType.FILL_BLANK),
            Map.entry("string", StepType.STRING),
            Map.entry("number", StepType.NUMBER),
            Map.entry("free-answer", StepType.FREE_ANSWER),
            Map.entry("math", StepType.MATH),
            Map.entry("random-tasks", StepType.RANDOM_TASKS),
            Map.entry("code", StepType.CODE)
    );

    private static final Map<StepType, String> ENUM_TO_STRING = Map.ofEntries(
            Map.entry(StepType.TEXT, "text"),
            Map.entry(StepType.CHOICE, "choice"),
            Map.entry(StepType.MATCHING, "matching"),
            Map.entry(StepType.SORTING, "sorting"),
            Map.entry(StepType.TABLE, "table"),
            Map.entry(StepType.FILL_BLANK, "fill-blanks"),
            Map.entry(StepType.STRING, "string"),
            Map.entry(StepType.NUMBER, "number"),
            Map.entry(StepType.FREE_ANSWER, "free-answer"),
            Map.entry(StepType.MATH, "math"),
            Map.entry(StepType.RANDOM_TASKS, "random-tasks"),
            Map.entry(StepType.CODE, "code")
    );

    public String normalize(String rawType) {
        if (rawType == null) {
            return null;
        }
        String t = rawType.trim().toLowerCase();
        return switch (t) {
            case "fill_blank", "fill_blanks", "fillblanks" -> "fill-blanks";
            case "free_answer", "freeanswer" -> "free-answer";
            case "random_tasks", "randomtasks" -> "random-tasks";
            default -> t;
        };
    }

    public boolean isSupported(String rawType) {
        return STRING_TO_ENUM.containsKey(normalize(rawType));
    }

    public Optional<StepType> toStepType(String rawType) {
        return Optional.ofNullable(STRING_TO_ENUM.get(normalize(rawType)));
    }

    public Optional<String> toStringType(StepType stepType) {
        return Optional.ofNullable(ENUM_TO_STRING.get(stepType));
    }
}
