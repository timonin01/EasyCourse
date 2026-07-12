package org.core.service.agent.course.tools.util;

import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.tools.EntityHints;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class ContextHintParser {

    private static final Pattern SECTION_ONLY = Pattern.compile(
            "Контекст:\\s*модуль\\s*«([^»]+)»",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern LESSON_WITH_SECTION = Pattern.compile(
            "Контекст:\\s*урок\\s*«([^»]+)»\\s*,\\s*модуль\\s*«([^»]+)»",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern MODULE_QUOTED = Pattern.compile(
            "модуль\\s*«([^»]+)»",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern LESSON_QUOTED = Pattern.compile(
            "урок\\s*«([^»]+)»",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private ContextHintParser() {
    }

    public static EntityHints parseFromUserInput(String userInput) {
        if (userInput == null || userInput.isBlank()) {
            return new EntityHints(null, null, null);
        }

        Matcher lessonMatcher = LESSON_WITH_SECTION.matcher(userInput);
        if (lessonMatcher.find()) {
            return new EntityHints(
                    lessonMatcher.group(2).trim(),
                    lessonMatcher.group(1).trim(),
                    null);
        }

        Matcher sectionMatcher = SECTION_ONLY.matcher(userInput);
        if (sectionMatcher.find()) {
            return new EntityHints(sectionMatcher.group(1).trim(), null, null);
        }

        return new EntityHints(null, null, null);
    }

    public static EntityHints parseFromHistory(List<ChatMessage> history) {
        if (history == null || history.isEmpty()) {
            return new EntityHints(null, null, null);
        }

        for (int index = history.size() - 1; index >= 0; index--) {
            ChatMessage message = history.get(index);
            if (message == null || !"user".equals(message.getRole())) {
                continue;
            }
            String content = message.getContent();
            if (content == null || content.isBlank()) {
                continue;
            }
            if (content.startsWith("ЗАПРОС ПОЛЬЗОВАТЕЛЯ:")
                    || content.startsWith("Выбран вариант:")
                    || content.startsWith("РЕЗУЛЬТАТ ИНСТРУМЕНТА")) {
                continue;
            }

            EntityHints fromContextPrefix = parseFromUserInput(content);
            if (hasAnyHint(fromContextPrefix)) {
                return fromContextPrefix;
            }

            Matcher lessonMatcher = LESSON_WITH_SECTION.matcher(content);
            if (lessonMatcher.find()) {
                return new EntityHints(
                        lessonMatcher.group(2).trim(),
                        lessonMatcher.group(1).trim(),
                        null);
            }

            Matcher moduleMatcher = MODULE_QUOTED.matcher(content);
            if (moduleMatcher.find()) {
                String sectionHint = moduleMatcher.group(1).trim();
                String lessonHint = null;
                Matcher lessonQuotedMatcher = LESSON_QUOTED.matcher(content);
                if (lessonQuotedMatcher.find()) {
                    lessonHint = lessonQuotedMatcher.group(1).trim();
                }
                return new EntityHints(sectionHint, lessonHint, null);
            }
        }

        return new EntityHints(null, null, null);
    }

    public static EntityHints merge(EntityHints fromArgs, EntityHints fromInput) {
        return new EntityHints(
                firstNonBlank(fromArgs.sectionHint(), fromInput.sectionHint()),
                firstNonBlank(fromArgs.lessonHint(), fromInput.lessonHint()),
                firstNonBlank(fromArgs.stepHint(), fromInput.stepHint()));
    }

    public static EntityHints mergeAll(EntityHints... hints) {
        EntityHints merged = new EntityHints(null, null, null);
        if (hints == null) {
            return merged;
        }
        for (EntityHints hint : hints) {
            if (hint != null) {
                merged = merge(merged, hint);
            }
        }
        return merged;
    }

    private static boolean hasAnyHint(EntityHints hints) {
        return hints.sectionHint() != null || hints.lessonHint() != null || hints.stepHint() != null;
    }

    private static String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return null;
    }
}
