package org.core.service.stepik.lesson;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.dto.LessonCaptchaChallenge;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.stepik.lesson.StepikLessonResponseData;
import org.core.dto.stepik.unit.StepikUnitResponseData;
import org.core.exception.exceptions.StepikLessonIntegrationException;
import org.core.service.crud.LessonService;
import org.core.service.crud.SectionService;
import org.core.service.stepik.unit.StepikUnitService;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikLessonSyncService {

    private final StepikLessonService stepikLessonService;
    private final LessonService lessonService;
    private final SectionService sectionService;
    private final StepikUnitService stepikUnitService;
    private final UpdateStepikLessonService updateStepikLessonService;

    public LessonCaptchaChallenge syncLessonWithStepik(Long lessonId, String captchaToken) {
        if (captchaToken != null) {
            log.info("Captcha token length: {}, starts with: {}", 
                    captchaToken.length(), 
                    captchaToken.substring(0, Math.min(captchaToken.length(), 30)) + "...");
        }
        LessonResponseDTO lessonDTO = lessonService.getLessonByLessonID(lessonId);
        
        if (lessonDTO.getStepikLessonId() != null) {
            log.info("Lesson {} is already synced with Stepik (ID: {}). Returning success.", 
                    lessonId, lessonDTO.getStepikLessonId());
            LessonCaptchaChallenge result = LessonCaptchaChallenge.noCaptchaNeeded(lessonId);
            result.setCaptchaKey(lessonDTO.getStepikLessonId().toString());
            result.setMessage("Lesson is already synced with Stepik (ID: " + lessonDTO.getStepikLessonId() + ")");
            return result;
        }
        
        Lesson lesson = mapToLesson(lessonDTO);

        LessonCaptchaChallenge result = stepikLessonService.tryCreateLessonAndGetCaptcha(lesson, captchaToken);
        return processStepikResponse(lessonId, result);
    }

    public StepikLessonResponseData updateLessonInStepik(Long lessonId) {
        LessonResponseDTO lessonDTO = lessonService.getLessonByLessonID(lessonId);
        if (lessonDTO.getStepikLessonId() == null) {
            throw new IllegalStateException("Lesson is not synced with Stepik. Lesson ID: " + lessonId);
        }

        StepikUnitResponseData unitData = stepikUnitService.getUnitByLessonId(lessonDTO.getStepikLessonId());
        Integer currentStepikPosition = unitData.getPosition();
        Integer currentDbPosition = lessonDTO.getPosition();
        
        if (currentStepikPosition.equals(currentDbPosition)) {
            log.info("Positions match, performing simple update");
            Lesson lesson = mapToLesson(lessonDTO);
            stepikLessonService.updateLesson(lesson.getStepikLessonId());
            stepikUnitService.updateUnitPosition(unitData.getId(), currentDbPosition, unitData);
            return stepikLessonService.getLessonByStepikId(lessonDTO.getStepikLessonId());
        }
        
        Lesson lesson = mapToLesson(lessonDTO);
        lesson.setPosition(currentStepikPosition);

        try {
            return updateStepikLessonService.performStepikPositionShift(lesson, lessonDTO.getSectionId(), currentDbPosition);
        } catch (StepikLessonIntegrationException e) {
            log.error("Error updating lesson in Stepik : {}", e.getMessage());
            throw new StepikLessonIntegrationException("Failed to update lesson in Stepik: " + e.getMessage());
        }
    }

    public void deleteLessonFromStepik(Long lessonId) {
        LessonResponseDTO lessonDTO = lessonService.getLessonByLessonID(lessonId);
        log.info("Lesson data: ID={}, Title='{}', StepikLessonId={}",
                lessonDTO.getId(), lessonDTO.getTitle(), lessonDTO.getStepikLessonId());

        if (lessonDTO.getStepikLessonId() == null) {
            throw new IllegalStateException("Lesson is not synced with Stepik. Lesson ID: " + lessonId);
        }
        updateStepikLessonService.performStepikPositionShiftAfterDeletion(lessonDTO.getSectionId(),lessonDTO.getPosition());
        lessonService.updateLessonStepikLessonIdSetNull(lessonId);

        stepikLessonService.deleteLesson(lessonDTO.getStepikLessonId());
        log.info("Lesson {} successfully deleted from Stepik with lesson ID: {}", lessonId, lessonDTO.getStepikLessonId());
    }

    private Lesson mapToLesson(LessonResponseDTO lessonDTO) {
        Lesson lesson = new Lesson();
        lesson.setId(lessonDTO.getId());
        lesson.setTitle(lessonDTO.getTitle());
        lesson.setPosition(lessonDTO.getPosition());
        lesson.setStepikLessonId(lessonDTO.getStepikLessonId());
        
        if (lessonDTO.getSectionId() != null) {
            try {
                SectionResponseDTO sectionDTO = sectionService.getSectionBySectionId(lessonDTO.getSectionId());
                Section section = new Section();
                section.setId(sectionDTO.getId());
                section.setStepikSectionId(sectionDTO.getStepikSectionId());
                lesson.setSection(section);
                log.info("Mapped lesson {} to section {} with stepikSectionId: {}", 
                        lessonDTO.getId(), sectionDTO.getId(), sectionDTO.getStepikSectionId());
            } catch (Exception e) {
                log.error("Failed to get section data for lesson {}: {}", lessonDTO.getId(), e.getMessage());
            }
        }
        
        return lesson;
    }

    private LessonCaptchaChallenge processStepikResponse(Long lessonId, LessonCaptchaChallenge result) {
        if (result.getCaptchaKey() != null && result.getCaptchaKey().matches("\\d+")) {
            return handleSuccessfulLessonCreation(lessonId, result);
        }
        else if (result.getSiteKey() != null) {
            log.info("Captcha required for lesson creation");
            return result;
        }
        return result;
    }

    private LessonCaptchaChallenge handleSuccessfulLessonCreation(Long lessonId, LessonCaptchaChallenge result) {
        Long stepikLessonId = Long.parseLong(result.getCaptchaKey());

        lessonService.updateLessonStepikLessonId(lessonId, stepikLessonId);
        log.info("Updated local lesson {} with Stepik ID: {}", lessonId, stepikLessonId);

        LessonResponseDTO lessonDTO = lessonService.getLessonByLessonID(lessonId);
        Lesson lesson = mapToLesson(lessonDTO);
        
        if (lesson.getSection() != null && lesson.getSection().getStepikSectionId() != null) {
            try {
                stepikUnitService.createUnit(stepikLessonId, lesson.getSection().getStepikSectionId(), lesson.getPosition());
                log.info("Successfully created unit for lesson {} in section {}", stepikLessonId, lesson.getSection().getStepikSectionId());
            } catch (Exception e) {
                log.error("Failed to create unit for lesson {} in section {}: {}", 
                        stepikLessonId, lesson.getSection().getStepikSectionId(), e.getMessage());
            }
        }

        if (result.getCaptchaImageUrl() != null) {
            result.setMessage("Lesson created successfully in Stepik with ID: " + stepikLessonId + " and captcha token saved");
            log.info("Updated local lesson {} with Stepik ID: {} and captcha token", lessonId, stepikLessonId);
        } else {
            result.setMessage("Lesson created successfully in Stepik with ID: " + stepikLessonId);
            log.info("Updated local lesson {} with Stepik ID: {}", lessonId, stepikLessonId);
        }
        return result;
    }
}
