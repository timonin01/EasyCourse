package org.core.service.agent.course.router;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.course.CourseAgentIntent;
import org.core.service.agent.course.CourseIntentResult;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Slf4j
public class CourseIntentRouter implements CourseIntentClassifier {

    private static final List<String> MODIFY_VERBS = List.of(
            "исправ", "переписа", "перепиш", "измени", "измен", "поправ",
            "отредактир", "улучш", "доработ", "переделай", "переделать");

    private static final List<String> DELETE_VERBS = List.of(
            "удал", "убер", "убра", "сотр", "уничтож", "delete", "remove");

    private static final List<String> SECTION_NOUNS = List.of("модул", "секци", "раздел");
    private static final List<String> LESSON_NOUNS = List.of("урок", "занят");
    private static final List<String> STEP_NOUNS = List.of("шаг", "задани", "задач", "вопрос", "теори");

    private static final List<String> INTO_SECTION = List.of("в модул", "в секци", "в раздел", "во модул");
    private static final List<String> INTO_LESSON = List.of("в урок", "во урок", "в занят");

    private static final Set<String> FILLER_TOKENS = Set.of(
            "про", "по", "о", "об", "на", "с", "под", "the", "a");

    private static final Set<String> STOP_TOKENS = Set.of(
            "в", "во", "на", "и", "или", "с", "для", "к", "модуль", "модуле", "модуля",
            "секция", "секции", "раздел", "разделе", "урок", "уроке", "урока", "уроков",
            "шаг", "шаги", "шагов", "задание", "задания", "задачу", "задачи", "вопрос",
            "теорию", "теория", "добавь", "создай", "сделай", "исправь", "измени");

    @Override
    public CourseIntentResult classify(String userInput) {
        if (userInput == null || userInput.isBlank()) {
            return CourseIntentResult.of(CourseAgentIntent.UNKNOWN);
        }
        String text = userInput.toLowerCase().trim();

        boolean modify = containsAny(text, MODIFY_VERBS);
        boolean delete = containsAny(text, DELETE_VERBS);
        boolean sectionNoun = containsAny(text, SECTION_NOUNS);
        boolean lessonNoun = containsAny(text, LESSON_NOUNS);
        boolean stepNoun = containsAny(text, STEP_NOUNS);
        boolean intoSection = containsAny(text, INTO_SECTION);
        boolean intoLesson = containsAny(text, INTO_LESSON);

        String sectionHint = extractHint(text, SECTION_NOUNS);
        String lessonHint = extractHint(text, LESSON_NOUNS);
        String stepHint = extractNumber(text, STEP_NOUNS);

        CourseAgentIntent intent = classifyByFlags(
                delete, modify, sectionNoun, lessonNoun, stepNoun, intoSection, intoLesson);
        log.info("Rule intent for '{}': {} (sectionHint={}, lessonHint={}, stepHint={})",
                userInput, intent, sectionHint, lessonHint, stepHint);
        return new CourseIntentResult(intent, sectionHint, lessonHint, stepHint);
    }

    private CourseAgentIntent classifyByFlags(boolean delete, boolean modify, boolean sectionNoun,
                                              boolean lessonNoun, boolean stepNoun,
                                              boolean intoSection, boolean intoLesson) {
        if (delete && stepNoun) return CourseAgentIntent.DELETE_STEP;
        if (delete && lessonNoun) return CourseAgentIntent.DELETE_LESSON;
        if (delete && sectionNoun) return CourseAgentIntent.DELETE_SECTION;
        if (delete && intoLesson) return CourseAgentIntent.DELETE_STEP;
        if (delete && intoSection) return CourseAgentIntent.DELETE_LESSON;
        if (delete) return CourseAgentIntent.UNKNOWN;
        if (modify && stepNoun) return CourseAgentIntent.MODIFY_STEP;
        if (intoLesson) return CourseAgentIntent.CREATE_STEPS;
        if (intoSection) {
            if (lessonNoun) return CourseAgentIntent.CREATE_LESSON;
            if (stepNoun) return CourseAgentIntent.CREATE_STEPS;
            return CourseAgentIntent.CREATE_LESSON;
        }
        if (sectionNoun) return CourseAgentIntent.CREATE_SECTION;
        if (lessonNoun) return CourseAgentIntent.CREATE_LESSON;
        if (stepNoun) return CourseAgentIntent.CREATE_STEPS;
        return CourseAgentIntent.UNKNOWN;
    }

    private boolean containsAny(String text, List<String> needles) {
        for (String n : needles) {
            if (text.contains(n)) {
                return true;
            }
        }
        return false;
    }

    private String extractNumber(String text, List<String> nouns) {
        for (String noun : nouns) {
            Matcher m = Pattern.compile(noun + "\\w*\\s*(?:№|#|n)?\\s*(\\d+)").matcher(text);
            if (m.find()) {
                return m.group(1);
            }
        }
        return null;
    }

    private String extractHint(String text, List<String> nouns) {
        String number = extractNumber(text, nouns);
        if (number != null) {
            return number;
        }
        for (String noun : nouns) {
            int idx = text.indexOf(noun);
            if (idx < 0) {
                continue;
            }
            int from = idx + noun.length();
            String tail = text.substring(Math.min(from, text.length()));
            String name = extractName(tail);
            if (name != null && !name.isBlank()) {
                return name;
            }
        }
        return null;
    }

    private String extractName(String tail) {
        String[] tokens = tail.split("[^а-яёa-z0-9\\-]+");
        StringBuilder name = new StringBuilder();
        int taken = 0;
        for (String token : tokens) {
            if (token.isBlank()) {
                continue;
            }
            if (FILLER_TOKENS.contains(token)) {
                continue;
            }
            if (STOP_TOKENS.contains(token)) {
                if (taken > 0) {
                    break;
                }
                continue;
            }
            if (name.length() > 0) {
                name.append(' ');
            }
            name.append(token);
            if (++taken >= 3) {
                break;
            }
        }
        return name.length() == 0 ? null : name.toString();
    }
}
