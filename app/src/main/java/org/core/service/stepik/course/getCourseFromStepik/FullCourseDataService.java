package org.core.service.stepik.course.getCourseFromStepik;

import lombok.RequiredArgsConstructor;
import org.core.domain.Lesson;
import org.core.domain.Model;
import org.core.domain.Step;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.stepik.lesson.StepikLessonResponseData;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.dto.stepik.step.StepikStepSourceResponseData;
import org.core.dto.stepik.unit.StepikUnitResponseData;
import org.core.repository.LessonRepository;
import org.core.repository.ModelRepository;
import org.core.repository.StepRepository;
import org.core.service.stepik.lesson.StepikLessonService;
import org.core.service.stepik.lesson.SyncAllSectionLessonsFromStepikService;
import org.core.service.stepik.section.StepikSectionService;
import org.core.service.stepik.step.StepikStepService;
import org.core.service.stepik.unit.StepikUnitService;
import org.core.util.converterToDTO.ConverterStepikLessonResponseDataToLessonResponseDTO;
import org.core.util.converterToDTO.ConverterStepikSectionResponseDataToModelResponseDTO;
import org.core.util.converterToDTO.ConverterStepikStepSourceResponseDataToStepResponseDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class FullCourseDataService {

    private final StepikSectionService stepikSectionService;
    private final StepikLessonService stepikLessonService;
    private final StepikUnitService stepikUnitService;
    private final StepikStepService stepikStepService;

    private final SyncAllSectionLessonsFromStepikService syncAllSectionLessonsFromStepikService;

    private final ConverterStepikSectionResponseDataToModelResponseDTO sectionConverter;
    private final ConverterStepikLessonResponseDataToLessonResponseDTO lessonConverter;
    private final ConverterStepikStepSourceResponseDataToStepResponseDTO stepConverter;

    private final ModelRepository modelRepository;
    private final LessonRepository lessonRepository;
    private final StepRepository stepRepository;

    public List<ModelResponseDTO> getSectionsResponseDTO(Long stepikCourseId){
        List<ModelResponseDTO> modelResponseDTOS = new ArrayList<>();
        List<Long> sectionsId = stepikSectionService.getCourseSectionIds(stepikCourseId);
        for(Long id : sectionsId){
            StepikSectionResponseData stepikSectionResponseData = stepikSectionService.getSectionByStepikId(id);

            Model existingModel = modelRepository.findByStepikSectionId(id);
            Long localModelId = existingModel != null ? existingModel.getId() : null;
            modelResponseDTOS.add(sectionConverter.convert(stepikSectionResponseData, localModelId));
        }
        return modelResponseDTOS;
    }

    public List<LessonResponseDTO> getLessonsResponseDTO(List<ModelResponseDTO> modelResponseDTOS){
        List<LessonResponseDTO> lessonsResponseDTOS = new ArrayList<>();
        for(ModelResponseDTO model : modelResponseDTOS){
            List<Long> unitIds = syncAllSectionLessonsFromStepikService.getSectionUnitIds(model.getStepikSectionId());
            for(Long id : unitIds) {
                Long stepikLessonId = syncAllSectionLessonsFromStepikService.getLessonIdByUnitID(id);
                StepikLessonResponseData stepikLessonResponseData = stepikLessonService.getLessonByStepikId(stepikLessonId);

                StepikUnitResponseData unit = stepikUnitService.getUnitByLessonId(stepikLessonResponseData.getId());
                Integer position = unit.getPosition();

                Lesson existingLesson = lessonRepository.findByStepikLessonId(stepikLessonId);
                Long localLessonId = existingLesson != null ? existingLesson.getId() : null;
                lessonsResponseDTOS.add(lessonConverter.convert(stepikLessonResponseData, localLessonId, model.getId(), model.getStepikSectionId(), position));
            }
        }
        return lessonsResponseDTOS;
    }

    public List<StepResponseDTO> getStepResponseDTO(List<LessonResponseDTO> lessonsResponseDTOS){
        List<StepResponseDTO> stepResponseDTOS = new ArrayList<>();
        for(LessonResponseDTO lesson : lessonsResponseDTOS){
            List<Long> stepIds = stepikStepService.getLessonStepIdsFromStepik(lesson.getStepikLessonId());
            for(Long id : stepIds){
                StepikStepSourceResponseData stepSourceResponseData = stepikStepService.getStepikStepById(id);

                Step existingStep = stepRepository.findByStepikStepId(id);
                Long localStepId = existingStep != null ? existingStep.getId() : null;
                
                StepResponseDTO stepDTO = stepConverter.convert(stepSourceResponseData, localStepId);
                if (stepDTO != null) {
                    stepDTO.setLessonId(lesson.getStepikLessonId());
                    stepResponseDTOS.add(stepDTO);
                }
            }
        }
        return stepResponseDTOS;
    }

}
