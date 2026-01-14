package org.core.service.stepik.course.getCourseFromStepik;

import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.stepik.lesson.StepikLessonResponseData;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.dto.stepik.step.StepikStepSourceResponseData;
import org.core.dto.stepik.unit.StepikUnitResponseData;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.core.repository.StepRepository;
import org.core.service.stepik.lesson.StepikLessonService;
import org.core.service.stepik.lesson.StepikUnitLessonFetcher;
import org.core.service.stepik.section.StepikSectionService;
import org.core.service.stepik.step.StepikStepService;
import org.core.service.stepik.unit.StepikUnitService;
import org.core.util.converterToDTO.ConverterStepikLessonResponseDataToLessonResponseDTO;
import org.core.util.converterToDTO.ConverterStepikSectionResponseDataToModelResponseDTO;
import org.core.util.converterToDTO.ConverterStepikStepSourceResponseDataToStepResponseDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;

@Slf4j
@Component
@RequiredArgsConstructor
public class FullCourseDataService {

    @Resource(name = "virtualExecutor")
    private final ExecutorService virtualExecutor;

    private final StepikSectionService stepikSectionService;
    private final StepikLessonService stepikLessonService;
    private final StepikUnitService stepikUnitService;
    private final StepikStepService stepikStepService;

    private final StepikUnitLessonFetcher stepikUnitLessonFetcher;

    private final ConverterStepikSectionResponseDataToModelResponseDTO sectionConverter;
    private final ConverterStepikLessonResponseDataToLessonResponseDTO lessonConverter;
    private final ConverterStepikStepSourceResponseDataToStepResponseDTO stepConverter;

    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final StepRepository stepRepository;
    private final UserContextBean userContextBean;

    public List<SectionResponseDTO> getSectionsResponseDTO(Long stepikCourseId, Long userId){
        List<Long> sectionsIds = stepikSectionService.getCourseSectionIds(stepikCourseId);

        List<CompletableFuture<SectionResponseDTO>> modelResponseDTOS = sectionsIds.stream()
                .map(id -> CompletableFuture.supplyAsync(() -> {
                    try {
                        userContextBean.setUserId(userId);
                        StepikSectionResponseData stepikSectionResponseData = stepikSectionService.getSectionByStepikId(id);

                        Section existingSection = sectionRepository.findByStepikSectionId(id);
                        Long localSectionId = existingSection != null ? existingSection.getId() : null;
                        return sectionConverter.convert(stepikSectionResponseData, localSectionId);
                    } catch (Exception e) {
                        log.error("Failed to load section {}: {}", id, e.getMessage(), e);
                        return null;
                    } finally {
                        userContextBean.clear();
                    }
                },virtualExecutor)).toList();
        return modelResponseDTOS.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .toList();
    }

    public List<LessonResponseDTO> getLessonsResponseDTO(List<SectionResponseDTO> sectionResponseDTOS, Long userId){
        List<CompletableFuture<List<LessonResponseDTO>>> lessonsResponseDTOS = sectionResponseDTOS.stream()
                .map(section -> CompletableFuture.<List<LessonResponseDTO>>supplyAsync(() -> {
                    try {
                        userContextBean.setUserId(userId);
                        List<Long> unitIds = stepikUnitLessonFetcher.getSectionUnitIds(section.getStepikSectionId());
                        return unitIds.stream()
                                .map(id -> CompletableFuture.supplyAsync(() -> {
                                    try {
                                        // Устанавливаем userId в ThreadLocal для вложенного потока
                                        userContextBean.setUserId(userId);
                                        Long stepikLessonId = stepikUnitLessonFetcher.getLessonIdByUnitID(id);
                                        StepikLessonResponseData stepikLessonResponseData = stepikLessonService.getLessonByStepikId(stepikLessonId);

                                        StepikUnitResponseData unit = stepikUnitService.getUnitByLessonId(stepikLessonResponseData.getId());
                                        Integer position = unit.getPosition();

                                        Lesson existingLesson = lessonRepository.findByStepikLessonId(stepikLessonId);
                                        Long localLessonId = existingLesson != null ? existingLesson.getId() : null;
                                        return lessonConverter.convert(stepikLessonResponseData, localLessonId, section.getId(), section.getStepikSectionId(), position);
                                    } catch (Exception e) {
                                        log.error("Failed to load lesson from unit {}: {}", id, e.getMessage(), e);
                                        return null;
                                    } finally {
                                        userContextBean.clear();
                                    }
                                }, virtualExecutor))
                                .map(CompletableFuture::join)
                                .filter(Objects::nonNull)
                                .toList();
                    } catch (Exception e) {
                        log.error("Failed to load lessons for section {}: {}", section.getStepikSectionId(), e.getMessage(), e);
                        return new ArrayList<>();
                    } finally {
                        userContextBean.clear();
                    }
                }, virtualExecutor))
                .toList();
        return lessonsResponseDTOS.stream()
                .map(CompletableFuture::join)
                .flatMap(List::stream)
                .toList();
    }

    public List<StepResponseDTO> getStepResponseDTO(List<LessonResponseDTO> lessonsResponseDTOS, Long userId){
        List<CompletableFuture<List<StepResponseDTO>>> stepResponseDTOS = lessonsResponseDTOS.stream()
                .map(lesson -> CompletableFuture.<List<StepResponseDTO>>supplyAsync(() -> {
                    try {
                        userContextBean.setUserId(userId);
                        List<Long> stepIds = stepikStepService.getLessonStepIdsFromStepik(lesson.getStepikLessonId());
                        return stepIds.stream()
                                .map(id -> CompletableFuture.supplyAsync(() -> {
                                    try {
                                        userContextBean.setUserId(userId);
                                        StepikStepSourceResponseData stepSourceResponseData = stepikStepService.getStepikStepById(id);

                                        Step existingStep = stepRepository.findByStepikStepId(id);
                                        Long localStepId = existingStep != null ? existingStep.getId() : null;

                                        StepResponseDTO stepDTO = stepConverter.convert(stepSourceResponseData, localStepId);
                                        if (stepDTO != null) {
                                            stepDTO.setLessonId(lesson.getStepikLessonId());
                                            return stepDTO;
                                        }
                                        return null;
                                    } catch (Exception e) {
                                        log.error("Failed to load step {}: {}", id, e.getMessage(), e);
                                        return null;
                                    } finally {
                                        userContextBean.clear();
                                    }
                                }, virtualExecutor))
                                .map(CompletableFuture::join)
                                .filter(Objects::nonNull)
                                .toList();
                    } catch (Exception e) {
                        log.error("Failed to load steps for lesson {}: {}", lesson.getStepikLessonId(), e.getMessage(), e);
                        return new ArrayList<StepResponseDTO>();
                    } finally {
                        userContextBean.clear();
                    }
                },virtualExecutor))
                .toList();
        return stepResponseDTOS.stream()
                .map(CompletableFuture::join)
                .flatMap(List::stream)
                .toList();
    }

}
