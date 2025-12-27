package org.core.service.stepik.lesson;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.lesson.UpdateLessonDTO;
import org.core.dto.stepik.lesson.StepikLessonResponseData;
import org.core.dto.stepik.unit.StepikUnitResponseData;
import org.core.exception.exceptions.StepikLessonIntegrationException;
import org.core.repository.LessonRepository;
import org.core.service.crud.LessonService;
import org.core.service.stepik.unit.StepikUnitService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UpdateStepikLessonService {

    private final LessonService lessonService;
    private final StepikLessonService stepikLessonService;
    private final StepikUnitService stepikUnitService;
    private final LessonRepository lessonRepository;

    @Transactional
    public StepikLessonResponseData performStepikPositionShift(Lesson lesson, Long modelId, Integer newPosition){
        if(lesson.getStepikLessonId() == null){
            throw new StepikLessonIntegrationException("Lesson must have stepikLessonId for position shift");
        }

        List<LessonResponseDTO> lessonsByModel = lessonService.getModelLessonsByModelId(modelId).stream()
                .filter(l -> l.getStepikLessonId() != null && !l.getId().equals(lesson.getId()))
                .toList();

        StepikUnitResponseData currentUnitData = stepikUnitService.getUnitByLessonId(lesson.getStepikLessonId());
        Integer oldPosition = currentUnitData.getPosition();

        if (newPosition < oldPosition) {
            lessonRepository.incrementPositionsRange(modelId, newPosition, oldPosition - 1);
            lessonRepository.flush();
            shiftLessonsDownInStepik(lessonsByModel, newPosition, oldPosition - 1);
            lessonService.updateLesson(createUpdateDTO(lesson.getId(), newPosition));
            stepikUnitService.updateUnitPosition(currentUnitData.getId(), newPosition, currentUnitData);
        } else if (newPosition > oldPosition) {
            lessonRepository.decrementPositionsRange(modelId, oldPosition + 1, newPosition);
            lessonRepository.flush();
            shiftLessonsUpInStepik(lessonsByModel, oldPosition + 1, newPosition);
            lessonService.updateLesson(createUpdateDTO(lesson.getId(), newPosition));
            stepikUnitService.updateUnitPosition(currentUnitData.getId(), newPosition, currentUnitData);
        } else {
            lessonService.updateLesson(createUpdateDTO(lesson.getId(), newPosition));
            stepikLessonService.updateLesson(lesson.getStepikLessonId());
        }

        return stepikLessonService.getLessonByStepikId(lesson.getStepikLessonId());
    }

    private void shiftLessonsDownInStepik(List<LessonResponseDTO> lessons, Integer fromPosition, Integer toPosition) {
        for (LessonResponseDTO lessonDTO : lessons) {
            try {
                StepikUnitResponseData unitData = stepikUnitService.getUnitByLessonId(lessonDTO.getStepikLessonId());
                Integer originalPosition = unitData.getPosition();
                
                if (originalPosition >= fromPosition && originalPosition <= toPosition) {

                    Integer newPosition = originalPosition + 1;
                    log.info("Updating lesson {} position in Stepik from {} to {}",
                            lessonDTO.getId(), originalPosition, newPosition);
                    
                    stepikUnitService.updateUnitPosition(unitData.getId(), newPosition, unitData);
                }
            } catch (Exception e) {
                log.warn("Lesson {} not found in Stepik (stepikLessonId: {}), skipping: {}", 
                        lessonDTO.getId(), lessonDTO.getStepikLessonId(), e.getMessage());
            }
        }
    }

    private void shiftLessonsUpInStepik(List<LessonResponseDTO> lessons, Integer fromPosition, Integer toPosition) {
        for (LessonResponseDTO lessonDTO : lessons) {
            try {
                StepikUnitResponseData unitData = stepikUnitService.getUnitByLessonId(lessonDTO.getStepikLessonId());
                Integer originalPosition = unitData.getPosition();
                
                if (originalPosition >= fromPosition && originalPosition <= toPosition) {

                    Integer newPosition = originalPosition - 1;
                    log.info("Updating lesson {} position in Stepik from {} to {}",
                            lessonDTO.getId(), originalPosition, newPosition);
                    
                    stepikUnitService.updateUnitPosition(unitData.getId(), newPosition, unitData);
                }
            } catch (Exception e) {
                log.warn("Lesson {} not found in Stepik (stepikLessonId: {}), skipping: {}", 
                        lessonDTO.getId(), lessonDTO.getStepikLessonId(), e.getMessage());
            }
        }
    }

    @Transactional
    public void performStepikPositionShiftAfterDeletion(Long modelId, Integer deletedPosition) {
        List<LessonResponseDTO> lessonsByModel = lessonService.getModelLessonsByModelId(modelId).stream()
                .filter(l -> l.getStepikLessonId() != null)
                .filter(l -> l.getPosition() > deletedPosition)
                .toList();

        for(LessonResponseDTO lessonResponseDTO : lessonsByModel){
            try {
                StepikUnitResponseData unitData = stepikUnitService.getUnitByLessonId(lessonResponseDTO.getStepikLessonId());
                Integer currentPosition = unitData.getPosition();
                Integer newPosition = currentPosition - 1;
                
                log.info("Shifting lesson {} in Stepik from position {} to {}",
                        lessonResponseDTO.getId(), currentPosition, newPosition);

                lessonService.updateLesson(createUpdateDTO(lessonResponseDTO.getId(), newPosition));
                stepikUnitService.updateUnitPosition(unitData.getId(), newPosition, unitData);
            } catch (Exception e) {
                log.warn("Failed to shift lesson {} in Stepik after deletion: {}", 
                        lessonResponseDTO.getId(), e.getMessage());
            }
        }
    }

    private UpdateLessonDTO createUpdateDTO(Long lessonId, Integer position) {
        UpdateLessonDTO updateDTO = new UpdateLessonDTO();
        updateDTO.setLessonId(lessonId);
        updateDTO.setPosition(position);
        return updateDTO;
    }

}
