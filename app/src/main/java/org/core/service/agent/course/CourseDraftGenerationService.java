package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.domain.StepType;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.agent.batchAnalyzer.CountStepDTO;
import org.core.dto.agent.course.CoursePlanDTO;
import org.core.dto.agent.course.LessonPlanDTO;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.dto.agent.course.PlanActionType;
import org.core.dto.lesson.CreateLessonDTO;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.section.CreateSectionDTO;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.step.CopyStepDTO;
import org.core.dto.step.CreateStepDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.core.enums.LlmModel;
import org.core.service.agent.batch.BatchGeneratorService;
import org.core.service.agent.batch.TheorySummaryCache;
import org.core.service.agent.course.sse.PlanExecutionProgress;
import org.core.service.crud.CourseStepCopyService;
import org.core.service.crud.LessonService;
import org.core.service.crud.SectionService;
import org.core.service.crud.StepService;
import org.core.util.UserAccessService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseDraftGenerationService {

    @Value("${course.draft.generation.max.length}")
    private int maxTitleLength;

    private final SectionService sectionService;
    private final LessonService lessonService;
    private final StepService stepService;
    private final CourseStepCopyService courseStepCopyService;
    private final BatchGeneratorService batchGeneratorService;
    private final CourseStepTypeMapper stepTypeMapper;
    private final UserAccessService userAccessService;
    private final LessonTheoryContextService lessonTheoryContextService;

    public ExecutionDraftResult executePlan(Long courseId, Long userId, String sessionId,
                                            CoursePlanDTO coursePlan, LlmModel llmModel,
                                            PlanExecutionProgress planExecutionProgress) {
        Course course = userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        CourseGenerationContext generationContext = CourseGenerationContext.from(course);
        List<Long> sectionIds = new ArrayList<>();
        List<Long> lessonIds = new ArrayList<>();
        List<Long> stepIds = new ArrayList<>();

        for (PlanActionDTO action : coursePlan.getActions()) {
            if (action == null || action.getType() == null) {
                continue;
            }
            switch (action.getType()) {
                case CREATE_SECTION -> executeCreateSection(
                        courseId, userId, sessionId, action, generationContext, llmModel,
                        sectionIds, lessonIds, stepIds, planExecutionProgress);
                case CREATE_LESSONS -> executeCreateLessons(
                        userId, sessionId, action, generationContext, llmModel, lessonIds, stepIds, planExecutionProgress);
                case CREATE_STEPS -> executeCreateSteps(
                        userId, sessionId, action, generationContext, llmModel, stepIds, planExecutionProgress);
                case COPY_STEP -> executeCopyStep(action, stepIds, planExecutionProgress);
                default -> throw new IllegalArgumentException("План не поддерживает выполнение: " + action.getType());
            }
        }

        log.info("Executed course plan for course {}: {} sections, {} lessons, {} steps (model: {})",
                courseId, sectionIds.size(), lessonIds.size(), stepIds.size(), llmModel);
        return new ExecutionDraftResult(sectionIds, lessonIds, stepIds);
    }

    private void executeCreateSection(Long courseId, Long userId, String sessionId, PlanActionDTO action,
                                      CourseGenerationContext generationContext, LlmModel llmModel,
                                      List<Long> sectionIds, List<Long> lessonIds, List<Long> stepIds,
                                      PlanExecutionProgress planExecutionProgress) {
        if (action.getSection() == null) {
            throw new IllegalArgumentException("В плане отсутствует модуль для создания");
        }
        CreateSectionDTO createSectionDTO = new CreateSectionDTO(
                courseId,
                truncateTitle(action.getSection().getTitle()),
                action.getSection().getDescription());
        SectionResponseDTO section = sectionService.createSection(createSectionDTO);
        sectionIds.add(section.getId());
        if (planExecutionProgress != null) {
            planExecutionProgress.publishSectionCreated(section.getTitle(), section.getId(), section.getPosition());
        }

        List<LessonPlanDTO> lessons = action.getSection().getLessons() == null
                ? Collections.emptyList()
                : action.getSection().getLessons();
        for (LessonPlanDTO lessonPlan : lessons) {
            createLessonWithSteps(section.getId(), action.getSection().getTitle(), lessonPlan, userId, sessionId,
                    generationContext, llmModel, lessonIds, stepIds, planExecutionProgress, PlanActionType.CREATE_SECTION);
        }
    }

    private void executeCreateLessons(Long userId, String sessionId, PlanActionDTO action,
                                      CourseGenerationContext generationContext, LlmModel llmModel,
                                      List<Long> lessonIds, List<Long> stepIds,
                                      PlanExecutionProgress planExecutionProgress) {
        if (action.getTargetSectionId() == null) {
            throw new IllegalArgumentException("Не указан модуль (targetSectionId) для добавления уроков");
        }
        List<LessonPlanDTO> lessons = action.getLessons() == null ? Collections.emptyList() : action.getLessons();
        for (LessonPlanDTO lessonPlan : lessons) {
            createLessonWithSteps(action.getTargetSectionId(), action.getTargetSectionTitle(), lessonPlan,
                    userId, sessionId, generationContext, llmModel, lessonIds, stepIds, planExecutionProgress,
                    PlanActionType.CREATE_LESSONS);
        }
    }

    private void executeCreateSteps(Long userId, String sessionId, PlanActionDTO action,
                                    CourseGenerationContext generationContext, LlmModel llmModel,
                                    List<Long> stepIds, PlanExecutionProgress planExecutionProgress) {
        if (action.getTargetLessonId() == null) {
            throw new IllegalArgumentException("Не указан урок (targetLessonId) для добавления шагов");
        }
        generateAndCreateSteps(
                action.getTargetLessonId(),
                action.getTargetSectionTitle(),
                action.getTargetLessonTitle(),
                action.getSteps(),
                userId,
                sessionId,
                generationContext,
                llmModel,
                stepIds,
                planExecutionProgress,
                PlanActionType.CREATE_STEPS);
    }

    private void executeCopyStep(PlanActionDTO action, List<Long> stepIds, PlanExecutionProgress planExecutionProgress) {
        if (action.getTargetStepId() == null) {
            throw new IllegalArgumentException("Не указан исходный шаг (targetStepId) для копирования");
        }
        if (action.getTargetLessonId() == null) {
            throw new IllegalArgumentException("Не указан урок назначения (targetLessonId) для копирования");
        }
        String lessonTitle = action.getTargetLessonTitle();
        Long lessonId = action.getTargetLessonId();
        if (planExecutionProgress != null) {
            planExecutionProgress.publishStepStarted(lessonTitle, null, lessonId, PlanActionType.COPY_STEP);
        }
        try {
            CopyStepDTO copyStepDTO = new CopyStepDTO(action.getTargetStepId(), action.getTargetLessonId());
            StepResponseDTO created = courseStepCopyService.createStepCopy(copyStepDTO);
            stepIds.add(created.getId());
            if (planExecutionProgress != null) {
                planExecutionProgress.publishStepCreated(lessonTitle, created.getType(), created.getId(),
                        lessonId, created.getPosition(), PlanActionType.COPY_STEP);
            }
        } catch (Exception e) {
            log.error("Failed to copy step {} into lesson {}: {}",
                    action.getTargetStepId(), action.getTargetLessonId(), e.getMessage());
            if (planExecutionProgress != null) {
                planExecutionProgress.publishStepFailed(lessonTitle, null, lessonId, e.getMessage());
            }
        }
    }

    private void createLessonWithSteps(Long sectionId, String moduleTitle, LessonPlanDTO lessonPlan, Long userId,
                                       String sessionId, CourseGenerationContext generationContext, LlmModel llmModel,
                                       List<Long> lessonIds, List<Long> stepIds, PlanExecutionProgress planExecutionProgress,
                                       PlanActionType actionType) {
        LessonResponseDTO lesson = lessonService.createLesson(new CreateLessonDTO(sectionId, truncateTitle(lessonPlan.getTitle())));
        lessonIds.add(lesson.getId());
        if (planExecutionProgress != null) {
            planExecutionProgress.publishLessonCreated(
                    moduleTitle, lesson.getTitle(), lesson.getId(), sectionId, lesson.getPosition());
        }
        generateAndCreateSteps(lesson.getId(), moduleTitle, lesson.getTitle(), lessonPlan.getSteps(),
                userId, sessionId, generationContext, llmModel, stepIds, planExecutionProgress, actionType);
    }

    private void generateAndCreateSteps(Long lessonId, String moduleTitle, String lessonTitle, List<CountStepDTO> steps,
                                        Long userId, String sessionId, CourseGenerationContext generationContext,
                                        LlmModel llmModel, List<Long> stepIds, PlanExecutionProgress planExecutionProgress,
                                        PlanActionType actionType) {
        if (steps == null || steps.isEmpty()) {
            return;
        }
        List<StepikBlockRequest> theoryContext = new ArrayList<>(lessonTheoryContextService.loadTextBlocksFromLesson(lessonId));
        TheorySummaryCache theorySummaryCache = new TheorySummaryCache();
        for (CountStepDTO countStep : steps) {
            String normalizedType = stepTypeMapper.normalize(countStep.getType());
            if (!stepTypeMapper.isSupported(normalizedType)) {
                log.warn("Skipping unsupported step type '{}' for lesson {}", countStep.getType(), lessonId);
                if (planExecutionProgress != null) {
                    planExecutionProgress.publishStepFailed(
                            lessonTitle, null, lessonId, "неподдерживаемый тип: " + countStep.getType());
                }
                continue;
            }
            StepType stepType = stepTypeMapper.toStepType(normalizedType).orElseThrow();

            CountStepDTO normalizedStep = new CountStepDTO(
                    normalizedType,
                    countStep.getCount() == null || countStep.getCount() < 1 ? 1 : countStep.getCount(),
                    generationContext.enrichStepInput(
                            resolveSpecificInput(countStep.getSpecificInput(), lessonTitle),
                            moduleTitle,
                            lessonTitle),
                    countStep.getUseSummarizedEnabled());

            BatchStepDTO singleTypePlan = new BatchStepDTO(new ArrayList<>(List.of(normalizedStep)));

            if (planExecutionProgress != null) {
                planExecutionProgress.publishStepStarted(lessonTitle, stepType, lessonId, actionType);
            }

            List<StepikBlockRequest> requests;
            try {
                requests = batchGeneratorService.generateBatchRequests(
                        userId, sessionId, singleTypePlan, theoryContext, llmModel, theorySummaryCache);
            } catch (Exception e) {
                log.error("Failed to generate steps of type {} for lesson {}: {}", normalizedType, lessonId, e.getMessage());
                if (planExecutionProgress != null) {
                    planExecutionProgress.publishStepFailed(lessonTitle, stepType, lessonId, e.getMessage());
                }
                continue;
            }

            for (StepikBlockRequest request : requests) {
                try {
                    CreateStepDTO createStepDTO = new CreateStepDTO();
                    createStepDTO.setLessonId(lessonId);
                    createStepDTO.setType(stepType);
                    createStepDTO.setContent(extractContent(request));
                    createStepDTO.setStepikBlock(request);
                    StepResponseDTO created = stepService.createStep(createStepDTO);
                    stepIds.add(created.getId());
                    if (planExecutionProgress != null) {
                        planExecutionProgress.publishStepCreated(
                                lessonTitle, stepType, created.getId(), lessonId, created.getPosition(), actionType);
                    }
                    if ("text".equals(normalizedType)) {
                        theoryContext.add(request);
                    }
                } catch (Exception e) {
                    log.error("Failed to persist generated step of type {} in lesson {}: {}",
                            normalizedType, lessonId, e.getMessage());
                    if (planExecutionProgress != null) {
                        planExecutionProgress.publishStepFailed(lessonTitle, stepType, lessonId, e.getMessage());
                    }
                }
            }
        }
    }

    private String truncateTitle(String title) {
        if (title == null) {
            return "Без названия";
        }
        String trimmed = title.trim();
        if (trimmed.isEmpty()) {
            return "Без названия";
        }
        return trimmed.length() <= maxTitleLength ? trimmed : trimmed.substring(0, maxTitleLength);
    }

    private String resolveSpecificInput(String specificInput, String lessonTitle) {
        if (specificInput != null && !specificInput.isBlank()) {
            return specificInput;
        }
        if (lessonTitle != null && !lessonTitle.isBlank()) {
            return lessonTitle;
        }
        return "по теме курса";
    }

    private String extractContent(StepikBlockRequest request) {
        if (request instanceof StepikBlockTextRequest textRequest) {
            return textRequest.getText();
        }
        return null;
    }
}
