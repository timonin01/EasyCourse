package org.core.service.agent.course.tools.handler;

import lombok.RequiredArgsConstructor;
import org.core.domain.Section;
import org.core.dto.agent.course.LessonPlanDTO;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.dto.agent.course.PlanActionType;
import org.core.dto.agent.tools.CourseAgentContext;
import org.core.dto.agent.tools.CourseToolResult;
import org.core.dto.agent.tools.EntityHints;
import org.core.dto.agent.tools.resolution.ResolvedSection;
import org.core.service.agent.course.*;
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
public class ProposeCreateLessonsHandler {

    private final CoursePlannerService plannerService;
    private final CourseSnapshotBuilder courseSnapshotBuilder;
    private final UserAccessService userAccessService;
    private final CoursePlanValidator planValidator;
    private final CourseEntityResolver entityResolver;

    public CourseToolResult handleProposeCreateLessons(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        String instruction = ToolArgsHelper.instruction(args, courseAgentContext.getUserInput());
        ResolvedSection section = resolveSection(courseAgentContext, args);

        if (section.needsClarification()) {
            List<Section> mentioned = findUnplannedSections(courseAgentContext, instruction);
            if (!mentioned.isEmpty()) {
                return planLessonsForSections(courseAgentContext, mentioned, instruction);
            }
            return section.result();
        }
        if (section.found()) {
            return planLessonsForSections(courseAgentContext, List.of(section.section()), instruction);
        }

        List<Section> mentioned = findUnplannedSections(courseAgentContext, instruction);
        if (!mentioned.isEmpty()) {
            return planLessonsForSections(courseAgentContext, mentioned, instruction);
        }
        return CourseToolResult.fail("Не нашёл модуль. Уточните название или номер.");
    }

    private CourseToolResult planLessonsForSections(CourseAgentContext courseAgentContext, List<Section> sections, String instruction) {
        int totalLessons = 0;
        int skippedSections = 0;
        StringBuilder summary = new StringBuilder();
        for (Section section : sections) {
            if (isSectionAlreadyInLessonPlan(courseAgentContext, section.getId())) {
                skippedSections++;
                continue;
            }
            List<LessonPlanDTO> lessonPlans = plannerService.planLessons(
                    courseSnapshotBuilder.buildSectionSnapshot(section, courseAgentContext.getCourse()),
                    instruction,
                    courseAgentContext.getLlmModel(),
                    courseAgentContext.getHistory());

            courseAgentContext.getPendingActions().add(PlanActionDTO.builder()
                    .type(PlanActionType.CREATE_LESSONS)
                    .targetSectionId(section.getId())
                    .targetSectionTitle(section.getTitle())
                    .lessons(lessonPlans)
                    .build());
            totalLessons += lessonPlans.size();
            if (!summary.isEmpty()) {
                summary.append("; ");
            }
            summary.append(String.format("%d урок(ов) в «%s»", lessonPlans.size(), section.getTitle()));
        }
        if (totalLessons == 0 && skippedSections > 0) {
            return CourseToolResult.ok("Уроки для указанных модулей уже в плане. Вызови FINISH.");
        }
        return CourseToolResult.ok(String.format(
                "Добавлено в план: %s (всего %d урок(ов))", summary, totalLessons));
    }

    private boolean isSectionAlreadyInLessonPlan(CourseAgentContext courseAgentContext, Long sectionId) {
        return courseAgentContext.getPendingActions().stream()
                .anyMatch(action -> action != null
                        && action.getType() == PlanActionType.CREATE_LESSONS
                        && sectionId.equals(action.getTargetSectionId()));
    }

    private List<Section> findUnplannedSections(CourseAgentContext courseAgentContext, String instruction) {
        Set<Long> plannedSectionIds = courseAgentContext.getPendingActions().stream()
                .filter(action -> action != null && action.getType() == PlanActionType.CREATE_LESSONS)
                .map(PlanActionDTO::getTargetSectionId)
                .filter(id -> id != null)
                .collect(Collectors.toCollection(HashSet::new));

        String searchText = firstNonBlank(instruction, courseAgentContext.getUserInput());
        return entityResolver.findSectionsMentionedInText(
                courseAgentContext.getCourse().getId(),
                searchText,
                plannedSectionIds);
    }

    private ResolvedSection resolveSection(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        Long sectionId = ToolArgsHelper.longArg(args, "sectionId");
        if (sectionId != null) {
            Section section = userAccessService.findSectionAndVerifyOwner(courseAgentContext.getUserId(), sectionId);
            planValidator.verifyCourse(courseAgentContext.getCourse().getId(), section.getCourse().getId());
            return ResolvedSection.found(section);
        }
        EntityHints hints = EntityHints.fromArgs(args);
        CourseResolution<Section> resolution = entityResolver.resolveSection(
                courseAgentContext.getCourse().getId(), hints.sectionHint());
        if (resolution.isAmbiguous()) {
            return ResolvedSection.clarify("Уточните, какой модуль имеется в виду:", resolution.candidates());
        }
        if (resolution.isFound()) {
            return ResolvedSection.found(resolution.value());
        }
        return ResolvedSection.notFound();
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
