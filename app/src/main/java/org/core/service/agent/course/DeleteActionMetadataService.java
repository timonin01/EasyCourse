package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.repository.LessonRepository;
import org.core.repository.StepRepository;
import org.core.service.agent.course.tools.util.CoursePlanHelper;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeleteActionMetadataService {

    private final UserAccessService userAccessService;
    private final LessonRepository lessonRepository;
    private final StepRepository stepRepository;
    private final CoursePlanHelper coursePlanHelper;

    public List<PlanActionDTO> prepareDeleteAction(Long userId, List<PlanActionDTO> actions) {
        if (actions == null) {
            return List.of();
        }
        return actions.stream()
                .map(action -> action != null && coursePlanHelper.isDeleteAction(action.getType())
                        ? prepare(userId, action)
                        : action)
                .collect(Collectors.toList());
    }

    public PlanActionDTO prepare(Long userId, PlanActionDTO action) {
        if (action == null || action.getType() == null) {
            return action;
        }
        return switch (action.getType()) {
            case DELETE_SECTION -> enrichSectionDelete(userId, action);
            case DELETE_LESSON -> enrichLessonDelete(userId, action);
            case DELETE_STEP -> enrichStepDelete(userId, action);
            default -> action;
        };
    }

    private PlanActionDTO enrichSectionDelete(Long userId, PlanActionDTO action) {
        if (action.getTargetSectionId() == null) {
            return action;
        }
        Section section = userAccessService.findSectionAndVerifyOwner(userId, action.getTargetSectionId());
        List<Lesson> lessons = lessonRepository.findByModelIdOrderByPositionAsc(section.getId());
        int lessonCount = lessons.size();
        int stepCount = lessons.stream()
                .mapToInt(lesson -> stepRepository.findByLessonIdOrderByPositionAsc(lesson.getId()).size())
                .sum();

        action.setCascadeLessonCount(lessonCount);
        action.setCascadeStepCount(stepCount);
        action.setDeleteFromStepik(hasSyncedSectionTree(section, lessons));
        if (action.getTargetSectionTitle() == null) {
            action.setTargetSectionTitle(section.getTitle());
        }
        return action;
    }

    private PlanActionDTO enrichLessonDelete(Long userId, PlanActionDTO action) {
        if (action.getTargetLessonId() == null) {
            return action;
        }
        Lesson lesson = userAccessService.findLessonAndVerifyOwner(userId, action.getTargetLessonId());
        List<Step> steps = stepRepository.findByLessonIdOrderByPositionAsc(lesson.getId());

        action.setTargetSectionId(lesson.getSection().getId());
        action.setTargetSectionTitle(lesson.getSection().getTitle());
        action.setTargetLessonTitle(lesson.getTitle());
        action.setCascadeLessonCount(0);
        action.setCascadeStepCount(steps.size());
        action.setDeleteFromStepik(hasSyncedLessonTree(lesson, steps));
        return action;
    }

    private PlanActionDTO enrichStepDelete(Long userId, PlanActionDTO action) {
        if (action.getTargetStepId() == null) {
            return action;
        }
        Step step = userAccessService.findStepAndVerifyOwner(userId, action.getTargetStepId());
        Lesson lesson = step.getLesson();
        Section section = lesson.getSection();

        action.setTargetSectionId(section.getId());
        action.setTargetSectionTitle(section.getTitle());
        action.setTargetLessonId(lesson.getId());
        action.setTargetLessonTitle(lesson.getTitle());
        if (action.getTargetStepTitle() == null) {
            action.setTargetStepTitle(String.format("Шаг %d [%s]", step.getPosition(), step.getType()));
        }
        action.setCascadeLessonCount(0);
        action.setCascadeStepCount(0);
        action.setDeleteFromStepik(step.getStepikStepId() != null);
        return action;
    }

    private boolean hasSyncedSectionTree(Section section, List<Lesson> lessons) {
        if (section.getStepikSectionId() != null) {
            return true;
        }
        for (Lesson lesson : lessons) {
            if (hasSyncedLessonTree(lesson, stepRepository.findByLessonIdOrderByPositionAsc(lesson.getId()))) {
                return true;
            }
        }
        return false;
    }

    private boolean hasSyncedLessonTree(Lesson lesson, List<Step> steps) {
        if (lesson.getStepikLessonId() != null) {
            return true;
        }
        return steps.stream().anyMatch(step -> step.getStepikStepId() != null);
    }
}
