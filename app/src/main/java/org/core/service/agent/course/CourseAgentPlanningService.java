package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.agent.batchAnalyzer.CountStepDTO;
import org.core.dto.agent.course.CourseAgentAction;
import org.core.dto.agent.course.CourseAgentIntent;
import org.core.dto.agent.course.CourseAgentResponse;
import org.core.dto.agent.course.CoursePlanDTO;
import org.core.dto.agent.course.LessonPlanDTO;
import org.core.dto.agent.course.SectionPlanDTO;
import org.core.enums.LlmModel;
import org.core.service.agent.batch.BatchAnalyzerService;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseAgentPlanningService {

    private final CourseEntityResolver entityResolver;
    private final CoursePlannerService plannerService;
    private final CourseSnapshotBuilder courseSnapshotBuilder;
    private final BatchAnalyzerService batchAnalyzerService;
    private final CoursePlanValidator planValidator;
    private final UserAccessService userAccessService;

    public CourseAgentResponse planSection(Course course, String userInput, LlmModel llmModel,
                                           List<ChatMessage> history) {
        String courseSnapshot = courseSnapshotBuilder.buildCourseSnapshot(course);
        SectionPlanDTO sectionPlan = plannerService.planSection(courseSnapshot, userInput, llmModel, history);

        CoursePlanDTO coursePlan = CoursePlanDTO.builder()
                .intent(CourseAgentIntent.CREATE_SECTION)
                .section(sectionPlan)
                .message(String.format("Будет создан модуль «%s»: %d урок(ов), %d шаг(ов).",
                        sectionPlan.getTitle(),
                        sectionPlan.getLessons() == null ? 0 : sectionPlan.getLessons().size(),
                        countSteps(sectionPlan)))
                .build();
        return showPlan(coursePlan);
    }

    public CourseAgentResponse planLessons(Course course, CourseIntentResult intent,
                                           String userInput, LlmModel llmModel,
                                           List<ChatMessage> history) {
        CourseResolution<Section> sectionResolution = entityResolver.resolveSection(course.getId(), intent.sectionHint());
        if (sectionResolution.isAmbiguous()) {
            return CourseAgentResponse.clarify(
                    "Уточните, в какой модуль добавить уроки:",
                    sectionResolution.candidates(),
                    CourseAgentIntent.CREATE_LESSON);
        }
        if (!sectionResolution.isFound()) {
            return CourseAgentResponse.clarify(
                    "Не нашёл подходящий существующий модуль. Уточните его название или номер.",
                    List.of(),
                    CourseAgentIntent.CREATE_LESSON);
        }
        return planLessonsInSection(sectionResolution.value(), userInput, llmModel, history);
    }

    public CourseAgentResponse planLessonsInSection(Section section, String userInput, LlmModel llmModel,
                                                    List<ChatMessage> history) {
        String snapshot = courseSnapshotBuilder.buildSectionSnapshot(section);
        List<LessonPlanDTO> lessonPlans = plannerService.planLessons(snapshot, userInput, llmModel, history);

        CoursePlanDTO plan = CoursePlanDTO.builder()
                .intent(CourseAgentIntent.CREATE_LESSON)
                .targetSectionId(section.getId())
                .targetSectionTitle(section.getTitle())
                .lessons(lessonPlans)
                .message(String.format("В модуль «%s» будет добавлено %d урок(ов), %d шаг(ов).",
                        section.getTitle(), lessonPlans.size(), countSteps(lessonPlans)))
                .build();
        return showPlan(plan);
    }

    public CourseAgentResponse planSteps(Course course, CourseIntentResult intent, String userInput) {
        CourseResolution<Lesson> lessonResolution = entityResolver.resolveLesson(course, intent);
        if (lessonResolution.isAmbiguous()) {
            return CourseAgentResponse.clarify(
                    "Уточните, в какой урок добавить шаги:",
                    lessonResolution.candidates(),
                    CourseAgentIntent.CREATE_STEPS);
        }
        if (!lessonResolution.isFound()) {
            return CourseAgentResponse.clarify(
                    "Не нашёл подходящий урок. Уточните модуль и урок.",
                    List.of(),
                    CourseAgentIntent.CREATE_STEPS);
        }
        return planStepsInLesson(lessonResolution.value(), userInput);
    }

    public CourseAgentResponse planStepsInLesson(Lesson lesson, String userInput) {
        BatchStepDTO analyzed = batchAnalyzerService.analyzeUserInput(userInput);
        List<CountStepDTO> steps = analyzed.getSteps();

        CoursePlanDTO plan = CoursePlanDTO.builder()
                .intent(CourseAgentIntent.CREATE_STEPS)
                .targetLessonId(lesson.getId())
                .targetLessonTitle(lesson.getTitle())
                .steps(steps)
                .message(String.format("В урок «%s» будет добавлено %d шаг(ов).",
                        lesson.getTitle(), countStepEntries(steps)))
                .build();
        return showPlan(plan);
    }

    public CourseAgentResponse editPlan(Long courseId, Long userId, CoursePlanDTO currentPlan,
                                        String instruction, LlmModel llmModel, List<ChatMessage> history) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        if (instruction == null || instruction.isBlank()) {
            throw new IllegalArgumentException("Опишите, что нужно изменить в плане");
        }

        planValidator.validate(courseId, userId, currentPlan);
        CoursePlanDTO editedPlan = plannerService.editPlan(currentPlan, instruction, llmModel, history);
        planValidator.validate(courseId, userId, editedPlan);
        updatePlanMessage(editedPlan);
        return showPlan(editedPlan);
    }

    private CourseAgentResponse showPlan(CoursePlanDTO plan) {
        return CourseAgentResponse.builder()
                .action(CourseAgentAction.SHOW_PLAN)
                .message(plan.getMessage())
                .plan(plan)
                .build();
    }

    private void updatePlanMessage(CoursePlanDTO plan) {
        switch (plan.getIntent()) {
            case CREATE_SECTION -> {
                SectionPlanDTO section = plan.getSection();
                int lessonCount = section == null || section.getLessons() == null ? 0 : section.getLessons().size();
                plan.setMessage(String.format(
                        "Скорректированный план: модуль «%s», %d урок(ов), %d шаг(ов).",
                        section == null ? "Без названия" : section.getTitle(),
                        lessonCount,
                        countSteps(section)));
            }
            case CREATE_LESSON -> plan.setMessage(String.format(
                    "Скорректированный план для модуля «%s»: %d урок(ов), %d шаг(ов).",
                    plan.getTargetSectionTitle(),
                    plan.getLessons() == null ? 0 : plan.getLessons().size(),
                    countSteps(plan.getLessons())));
            case CREATE_STEPS -> plan.setMessage(String.format(
                    "Скорректированный план для урока «%s»: %d шаг(ов).",
                    plan.getTargetLessonTitle(),
                    countStepEntries(plan.getSteps())));
            default -> {
            }
        }
    }

    private int countSteps(SectionPlanDTO section) {
        return section == null ? 0 : countSteps(section.getLessons());
    }

    private int countSteps(List<LessonPlanDTO> lessons) {
        if (lessons == null) {
            return 0;
        }
        return lessons.stream()
                .filter(lesson -> lesson != null)
                .mapToInt(lesson -> countStepEntries(lesson.getSteps()))
                .sum();
    }

    private int countStepEntries(List<CountStepDTO> steps) {
        if (steps == null) {
            return 0;
        }
        return steps.stream()
                .filter(step -> step != null)
                .mapToInt(step -> step.getCount() == null || step.getCount() < 1 ? 1 : step.getCount())
                .sum();
    }
}