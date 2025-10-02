package org.core.service.stepik.section;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Model;
import org.core.domain.Course;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.stepik.section.StepikSectionResponse;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.exception.StepikSectionIntegrationException;
import org.core.service.crud.ModelService;
import org.core.service.crud.CourseService;
import org.core.service.crud.LessonService;
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
    private final SyncAllCourseSectionsFromStepikService syncAllSectionLessonsFromStepik;

    public StepikSectionResponseData syncModelWithStepik(Long modelId) {
        log.info("Starting sync model ID: {} with Stepik", modelId);
        
        ModelResponseDTO modelDTO = modelService.getModelBuModelId(modelId);
        Model model = mapToModel(modelDTO);

        StepikSectionResponse response = stepikSectionService.createSection(model);
        StepikSectionResponseData sectionData = response.getSection();
        if (sectionData != null) {
            modelService.updateModelStepikSectionId(modelId, sectionData.getId());
            log.info("Model {} successfully synced with Stepik section ID: {}", modelId, sectionData.getId());
        }
        return sectionData;
    }

    public StepikSectionResponseData updateModelInStepik(Long modelId) {
        log.info("Starting manual update of model ID: {} in Stepik", modelId);
        
        ModelResponseDTO modelDTO = modelService.getModelBuModelId(modelId);
        log.info("Model data: ID={}, Title='{}', StepikSectionId={}", 
                modelDTO.getId(), modelDTO.getTitle(), modelDTO.getStepikSectionId());

        if (modelDTO.getStepikSectionId() == null) {
            throw new IllegalStateException("Model is not synced with Stepik. Model ID: " + modelId);
        }
        Model model = mapToModel(modelDTO);
        log.info("Mapped model for Stepik update: CourseId={}, Title='{}', Position={}", 
                model.getCourse().getId(), model.getTitle(), model.getPosition());
        
        StepikSectionResponse response = stepikSectionService.updateSection(modelDTO.getStepikSectionId(), model);
        StepikSectionResponseData sectionData = response.getSection();
        
        if (sectionData == null) {
            log.error("Received null section data from Stepik update response");
            throw new StepikSectionIntegrationException("No section data received from Stepik update");
        }
        log.info("Model {} successfully updated in Stepik with section ID: {}", modelId, sectionData.getId());
        return sectionData;
    }

    public void deleteModelFromStepik(Long modelId) {
        log.info("Starting manual deletion of model ID: {} from Stepik", modelId);
        
        ModelResponseDTO modelDTO = modelService.getModelBuModelId(modelId);
        if (modelDTO.getStepikSectionId() == null) {
            throw new IllegalStateException("Model is not synced with Stepik. Model ID: " + modelId);
        }
        
        log.info("Clearing stepikLessonId for all lessons in model {}", modelId);
        lessonService.clearStepikLessonIdsByModelId(modelId);
        
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
        
        log.info("Mapped model: ID={}, StepikSectionId={}, Title='{}'", 
                model.getId(), model.getStepikSectionId(), model.getTitle());

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