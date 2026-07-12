package org.core.service.agent.course.tools.handler;

import lombok.RequiredArgsConstructor;
import org.core.domain.Lesson;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.dto.agent.course.PlanActionType;
import org.core.dto.agent.tools.CourseAgentContext;
import org.core.dto.agent.tools.CourseToolResult;
import org.core.dto.agent.tools.EntityHints;
import org.core.dto.agent.tools.resolution.ResolvedLesson;
import org.core.service.agent.batch.BatchAnalyzerService;
import org.core.service.agent.course.CourseEntityResolver;
import org.core.service.agent.course.CoursePlanValidator;
import org.core.service.agent.course.CourseResolution;
import org.core.service.agent.course.tools.util.ToolArgsHelper;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProposeCreateStepsHandler {

    private final BatchAnalyzerService batchAnalyzerService;
    private final UserAccessService userAccessService;
    private final CoursePlanValidator planValidator;
    private final CourseEntityResolver entityResolver;

    public CourseToolResult handleProposeCreateSteps(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        String instruction = ToolArgsHelper.instruction(args, courseAgentContext.getUserInput());
        CourseToolResult pendingLessonsHint = checkPendingLessonPlans(courseAgentContext, instruction);
        if (pendingLessonsHint != null) {
            return pendingLessonsHint;
        }

        ResolvedLesson lesson = resolveLesson(courseAgentContext, args);

        if (lesson.needsClarification()) {
            List<Lesson> mentioned = findUnplannedLessons(courseAgentContext, instruction);
            if (!mentioned.isEmpty()) {
                return planStepsForLessons(courseAgentContext, mentioned, instruction);
            }
            return lesson.result();
        }
        if (lesson.found()) {
            return planStepsForLessons(courseAgentContext, List.of(lesson.lesson()), instruction);
        }

        List<Lesson> mentioned = findUnplannedLessons(courseAgentContext, instruction);
        if (!mentioned.isEmpty()) {
            return planStepsForLessons(courseAgentContext, mentioned, instruction);
        }
        pendingLessonsHint = checkPendingLessonPlans(courseAgentContext, instruction);
        if (pendingLessonsHint != null) {
            return pendingLessonsHint;
        }
        return CourseToolResult.fail(
                "Не нашёл урок в базе. Для новых уроков со шагами используй PROPOSE_CREATE_LESSONS, не PROPOSE_CREATE_STEPS.");
    }

    private CourseToolResult checkPendingLessonPlans(CourseAgentContext courseAgentContext, String instruction) {
        boolean hasPendingLessonPlans = courseAgentContext.getPendingActions().stream()
                .anyMatch(action -> action != null && action.getType() == PlanActionType.CREATE_LESSONS);
        if (!hasPendingLessonPlans) {
            return null;
        }
        String searchText = firstNonBlank(instruction, courseAgentContext.getUserInput());
        if (hasExistingLessonsExplicitlyMentioned(courseAgentContext, searchText)) {
            return null;
        }
        if (searchText == null) {
            return CourseToolResult.ok(
                    "Шаги для новых уроков уже включены в план PROPOSE_CREATE_LESSONS. Вызови FINISH.");
        }
        List<org.core.domain.Section> mentionedSections = entityResolver.findSectionsMentionedInText(
                courseAgentContext.getCourse().getId(),
                searchText,
                java.util.Collections.emptySet());
        if (mentionedSections.isEmpty()) {
            return CourseToolResult.ok(
                    "Шаги для новых уроков уже включены в план PROPOSE_CREATE_LESSONS. Вызови FINISH.");
        }
        boolean coversRequestedSections = mentionedSections.stream()
                .allMatch(section -> courseAgentContext.getPendingActions().stream()
                        .anyMatch(action -> action != null
                                && action.getType() == PlanActionType.CREATE_LESSONS
                                && section.getId().equals(action.getTargetSectionId())));
        if (coversRequestedSections) {
            return CourseToolResult.ok(
                    "Шаги для новых уроков уже включены в PROPOSE_CREATE_LESSONS. Вызови FINISH — PROPOSE_CREATE_STEPS не нужен.");
        }
        return null;
    }

    private CourseToolResult planStepsForLessons(CourseAgentContext courseAgentContext,
                                                 List<Lesson> lessons,
                                                 String instruction) {
        int totalSteps = 0;
        StringBuilder summary = new StringBuilder();
        for (Lesson lesson : lessons) {
            String scopedInstruction = String.format(
                    "Для урока «%s» в модуле «%s»: %s",
                    lesson.getTitle(),
                    lesson.getSection().getTitle(),
                    instruction);
            BatchStepDTO analyzed = batchAnalyzerService.analyzeUserInput(scopedInstruction);
            int stepCount = analyzed.getSteps() == null ? 0 : analyzed.getSteps().size();

            courseAgentContext.getPendingActions().add(PlanActionDTO.builder()
                    .type(PlanActionType.CREATE_STEPS)
                    .targetSectionId(lesson.getSection().getId())
                    .targetSectionTitle(lesson.getSection().getTitle())
                    .targetLessonId(lesson.getId())
                    .targetLessonTitle(lesson.getTitle())
                    .steps(analyzed.getSteps())
                    .build());
            totalSteps += stepCount;
            if (!summary.isEmpty()) {
                summary.append("; ");
            }
            summary.append(String.format("%d шаг(ов) в «%s»", stepCount, lesson.getTitle()));
        }
        return CourseToolResult.ok(String.format(
                "Добавлено в план: %s (всего %d шаг(ов))", summary, totalSteps));
    }

    private boolean hasExistingLessonsExplicitlyMentioned(CourseAgentContext courseAgentContext, String searchText) {
        if (searchText == null || searchText.isBlank()) {
            return false;
        }
        Set<Long> plannedStepLessonIds = courseAgentContext.getPendingActions().stream()
                .filter(action -> action != null && action.getType() == PlanActionType.CREATE_STEPS)
                .map(PlanActionDTO::getTargetLessonId)
                .filter(id -> id != null)
                .collect(Collectors.toCollection(HashSet::new));
        return !entityResolver.findLessonsExplicitlyNamedInText(
                courseAgentContext.getCourse().getId(),
                searchText,
                plannedStepLessonIds).isEmpty();
    }

    private List<Lesson> findUnplannedLessons(CourseAgentContext courseAgentContext, String instruction) {
        Set<Long> plannedLessonIds = courseAgentContext.getPendingActions().stream()
                .filter(action -> action != null && action.getType() == PlanActionType.CREATE_STEPS)
                .map(PlanActionDTO::getTargetLessonId)
                .filter(id -> id != null)
                .collect(Collectors.toCollection(HashSet::new));

        String searchText = firstNonBlank(instruction, courseAgentContext.getUserInput());
        return entityResolver.findLessonsMentionedInText(
                courseAgentContext.getCourse().getId(),
                searchText,
                plannedLessonIds);
    }

    private ResolvedLesson resolveLesson(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        Long lessonId = ToolArgsHelper.longArg(args, "lessonId");
        if (lessonId != null) {
            Lesson lesson = userAccessService.findLessonAndVerifyOwner(courseAgentContext.getUserId(), lessonId);
            planValidator.verifyCourse(courseAgentContext.getCourse().getId(), lesson.getSection().getCourse().getId());
            return ResolvedLesson.found(lesson);
        }
        EntityHints hints = EntityHints.fromArgs(args);
        CourseResolution<Lesson> resolution = entityResolver.resolveLesson(courseAgentContext.getCourse(), hints);
        if (resolution.isAmbiguous()) {
            return ResolvedLesson.clarify("Уточните, какой урок имеется в виду:", resolution.candidates());
        }
        if (resolution.isFound()) {
            return ResolvedLesson.found(resolution.value());
        }
        return ResolvedLesson.notFound();
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return null;
    }
}
