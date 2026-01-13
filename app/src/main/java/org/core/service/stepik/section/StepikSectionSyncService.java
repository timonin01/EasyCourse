package org.core.service.stepik.section;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Model;
import org.core.domain.Course;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.stepik.section.StepikSectionResponse;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.exception.exceptions.StepikLessonIntegrationException;
import org.core.exception.exceptions.StepikSectionIntegrationException;
import org.core.service.crud.ModelService;
import org.core.service.crud.CourseService;
import org.core.service.crud.LessonService;
import org.core.service.stepik.lesson.StepikLessonSyncService;
import org.core.dto.lesson.LessonResponseDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikSectionSyncService {

    private final StepikSectionService stepikSectionService;
    private final ModelService modelService;
    private final CourseService courseService;
    private final LessonService lessonService;
    private final UpdateStepikSectionService updateStepikSectionService;
    private final SyncAllCourseSectionsFromStepikService syncAllSectionLessonsFromStepik;
    private final StepikLessonSyncService stepikLessonSyncService;

    public StepikSectionResponseData syncModelWithStepik(Long modelId) {
        ModelResponseDTO modelDTO = modelService.getModelBuModelId(modelId);
        Model model = mapToModel(modelDTO);

        StepikSectionResponse response = stepikSectionService.createSection(model);
        StepikSectionResponseData sectionData = response.getSection();
        if (sectionData != null) {
            modelService.updateModelStepikSectionId(modelId, sectionData.getId());
            log.info("Model {} successfully synced with Stepik section ID: {}", modelId, sectionData.getId());
            
            // Синхронизируем все уроки модуля
            syncAllModelLessons(modelId);
        }
        return sectionData;
    }
    
    private void syncAllModelLessons(Long modelId) {
        List<LessonResponseDTO> lessons = lessonService.getModelLessonsByModelId(modelId);
        log.info("Syncing {} lessons for model {}", lessons.size(), modelId);
        
        for (LessonResponseDTO lesson : lessons) {
            try {
                if (lesson.getStepikLessonId() == null) {
                    log.info("Syncing lesson {} with Stepik", lesson.getId());
                    stepikLessonSyncService.syncLessonWithStepik(lesson.getId(), null);
                } else {
                    log.info("Lesson {} already synced with Stepik (ID: {}), skipping", lesson.getId(), lesson.getStepikLessonId());
                }
            } catch (Exception e) {
                log.error("Failed to sync lesson {} with Stepik: {}", lesson.getId(), e.getMessage(), e);
                // Продолжаем синхронизацию остальных уроков даже при ошибке
            }
        }
    }

    public StepikSectionResponseData updateModelInStepik(Long modelId) {
        ModelResponseDTO modelDTO = modelService.getModelBuModelId(modelId);
        if (modelDTO.getStepikSectionId() == null) {
            throw new IllegalStateException("Model is not synced with Stepik. Model ID: " + modelId);
        }

        StepikSectionResponseData sectionData = stepikSectionService.getSectionByStepikId(modelDTO.getStepikSectionId());
        Integer currentDbPosition = modelDTO.getPosition();
        Integer currentStepikPosition = sectionData.getPosition();

        if(currentDbPosition.equals(currentStepikPosition)){
            log.info("Positions match, performing simple update");
            Model model = mapToModel(modelDTO);
            stepikSectionService.updateSection(model.getStepikSectionId());
            return stepikSectionService.getSectionByStepikId(modelDTO.getStepikSectionId());
        }

        Model model = mapToModel(modelDTO);
        model.setPosition(currentStepikPosition);

        try{
            updateStepikSectionService.performStepikPositionShift(model,modelDTO.getCourseId(),currentDbPosition);
        }catch (StepikSectionIntegrationException e){
            log.error("Error updating section in Stepik : {}", e.getMessage());
            throw new StepikLessonIntegrationException("Failed to update section in Stepik: " + e.getMessage());
        }

        log.info("Model {} successfully updated in Stepik with section ID: {}", modelId, sectionData.getId());
        return sectionData;
    }

    public void deleteModelFromStepik(Long modelId) {
        ModelResponseDTO modelDTO = modelService.getModelBuModelId(modelId);
        if (modelDTO.getStepikSectionId() == null) {
            throw new IllegalStateException("Model is not synced with Stepik. Model ID: " + modelId);
        }
        lessonService.clearStepikLessonIdsByModelId(modelId);

        updateStepikSectionService.performStepikPositionShiftAfterDeletion(modelDTO.getCourseId(),modelDTO.getPosition());
        
        stepikSectionService.deleteSection(modelDTO.getStepikSectionId());
        modelService.updateModelStepikSectionId(modelId, null);
        
        log.info("Model {} successfully deleted from Stepik and unlinked", modelId);
    }

    private Model mapToModel(ModelResponseDTO modelDTO) {
        Model model = new Model();
        model.setId(modelDTO.getId());
        model.setTitle(modelDTO.getTitle());
        model.setDescription(modelDTO.getDescription());
        model.setPosition(modelDTO.getPosition());
        model.setStepikSectionId(modelDTO.getStepikSectionId());

        CourseResponseDTO courseDTO = courseService.getCourseByCourseId(modelDTO.getCourseId());
        if (courseDTO.getStepikCourseId() == null) {
            throw new IllegalStateException("Course must be synced with Stepik before syncing models. Course ID: " + courseDTO.getId());
        }
        Course course = new Course();
        course.setId(courseDTO.getStepikCourseId());
        course.setStepikCourseId(courseDTO.getStepikCourseId());
        model.setCourse(course);
        
        return model;
    }

    public List<ModelResponseDTO> syncAllCourseSectionFromStepik(Long courseId) {
        return syncAllSectionLessonsFromStepik.syncAllCourseSectionFromStepik(courseId);
    }
}