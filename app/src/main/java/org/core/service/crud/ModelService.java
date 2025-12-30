package org.core.service.crud;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.domain.Model;
import org.core.dto.model.CreateModelDTO;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.model.UpdateModelDTO;
import org.core.exception.exceptions.CourseNotFoundException;
import org.core.exception.exceptions.ModelNotFoundException;
import org.core.repository.CourseRepository;
import org.core.repository.ModelRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class ModelService {

    private final CourseRepository courseRepository;
    private final ModelRepository modelRepository;

    public ModelResponseDTO createModule(CreateModelDTO createDTO){
        Course course = courseRepository.findById(createDTO.getCourseId())
                .orElseThrow(() -> new CourseNotFoundException("Course not found"));
        
        Integer position = getNextPosition(course.getId());

        Model model = new Model();
        model.setCourse(course);
        model.setPosition(position);
        model.setTitle(createDTO.getTitle());
        model.setDescription(createDTO.getDescription());

        log.info("Created new model with ID: {} in course: {} at position {}", model.getId(), course.getId(), position);
        return mapToResponseDTO(modelRepository.save(model));
    }

    public Model createModuleFromDTO(ModelResponseDTO modelResponseDTO){
        Course course = courseRepository.findById(modelResponseDTO.getCourseId())
                .orElseThrow(() -> new CourseNotFoundException("Course not found"));

        Model model = Model.builder()
                .course(course)
                .title(modelResponseDTO.getTitle())
                .description(modelResponseDTO.getDescription())
                .position(modelResponseDTO.getPosition())
                .stepikSectionId(modelResponseDTO.getStepikSectionId())
                .createdAt(modelResponseDTO.getCreatedAt())
                .updatedAt(modelResponseDTO.getUpdatedAt())
                .build();
        return modelRepository.save(model);
    }

    public ModelResponseDTO getModelBuModelId(Long modelId){
        Model model = findModelByModelId(modelId);
        return mapToResponseDTO(model);
    }

    public List<ModelResponseDTO> getCourseModelsByCourseId(Long courseId){
        List<Model> models = modelRepository.findByCourseIdOrderByPositionAsc(courseId);
        return models.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<ModelResponseDTO> getUnsyncedModelsByCourseId(Long courseId){
        List<Model> unsyncedModels = modelRepository.findByCourseIdAndStepikSectionIdIsNullOrderByPositionAsc(courseId);
        log.info("Found {} unsynced models for course: {}", unsyncedModels.size(), courseId);
        return unsyncedModels.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public ModelResponseDTO updateModel(UpdateModelDTO updateDTO){
        Model model = findModelByModelId(updateDTO.getModelId());
        if(updateDTO.getTitle() != null){
            model.setTitle(updateDTO.getTitle());
        }
        if(updateDTO.getDescription() != null){
            model.setDescription(updateDTO.getDescription());
        }
        if (updateDTO.getPosition() != null && !updateDTO.getPosition().equals(model.getPosition())){
            changeLessonPosition(model,updateDTO.getPosition());
        }
        Model savedModel = modelRepository.save(model);
        log.info("Updated model with ID: {}", updateDTO.getModelId());
        return mapToResponseDTO(savedModel);
    }

    public void deleteModel(Long modelId){
        Model model = findModelByModelId(modelId);
        Long courseId = model.getCourse().getId();
        Integer position = model.getPosition();

        modelRepository.delete(model);
        reorderLessonsAfterDeletion(courseId,position);

        log.info("Deleted model with ID: {} from course: {}", modelId, courseId);
    }

    public ModelResponseDTO updateModelStepikSectionId(Long modelId, Long stepikSectionId) {
        Model model = findModelByModelId(modelId);
        model.setStepikSectionId(stepikSectionId);
        Model savedModel = modelRepository.save(model);
        log.info("Updated model ID: {} with Stepik section ID: {}", modelId, stepikSectionId);
        return mapToResponseDTO(savedModel);
    }

    private Model findModelByModelId(Long modelId){
        return modelRepository.findById(modelId)
                .orElseThrow(() -> new ModelNotFoundException("Model Not found"));
    }

    private Integer getNextPosition(Long courseId) {
        return modelRepository.findMaxPositionByCourseId(courseId)
                .map(pos -> pos + 1)
                .orElse(1);
    }

    private void shiftLessonsPositions(Long courseId, Integer fromPosition) {
        modelRepository.incrementPositionsFromPosition(courseId, fromPosition);
    }

    private void changeLessonPosition(Model model, Integer newPosition) {
        Long courseId = model.getCourse().getId();
        Integer oldPosition = model.getPosition();
        if (newPosition < oldPosition) {
            modelRepository.incrementPositionsRange(courseId, newPosition, oldPosition - 1);
        } else if (newPosition > oldPosition) {
            modelRepository.decrementPositionsRange(courseId, oldPosition + 1, newPosition);
        }
        model.setPosition(newPosition);
    }

    private void reorderLessonsAfterDeletion(Long courseId, Integer deletedPosition) {
        modelRepository.decrementPositionsFromPosition(courseId, deletedPosition);
    }

    private ModelResponseDTO mapToResponseDTO(Model model){
        return ModelResponseDTO.builder()
                .id(model.getId())
                .title(model.getTitle())
                .description(model.getDescription())
                .position(model.getPosition())
                .courseId(model.getCourse().getId())
                .stepikSectionId(model.getStepikSectionId())
                .createdAt(model.getCreatedAt())
                .updatedAt(model.getUpdatedAt())
                .build();
    }

}
