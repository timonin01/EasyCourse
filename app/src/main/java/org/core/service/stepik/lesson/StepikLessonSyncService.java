package org.core.service.stepik.lesson;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.Model;
import org.core.dto.LessonCaptchaChallenge;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.stepik.lesson.StepikLessonResponse;
import org.core.dto.stepik.lesson.StepikLessonResponseData;
import org.core.exception.StepikLessonIntegrationException;
import org.core.service.crud.LessonService;
import org.core.service.crud.ModelService;
import org.core.service.stepik.unit.StepikUnitService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikLessonSyncService {

    private final StepikLessonService stepikLessonService;
    private final LessonService lessonService;
    private final ModelService modelService;
    private final StepikUnitService stepikUnitService;
    private final SyncAllSectionLessonsFromStepikService syncAllSectionLessonsFromStepikService;

    public LessonCaptchaChallenge syncLessonWithStepik(Long lessonId, String captchaToken) {
        log.info("Starting sync lesson ID: {} with Stepik (captcha provided: {})", lessonId, captchaToken != null);
        
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
        log.info("Starting manual update of lesson ID: {} in Stepik", lessonId);
        
        LessonResponseDTO lessonDTO = lessonService.getLessonByLessonID(lessonId);
        if (lessonDTO.getStepikLessonId() == null) {
            throw new IllegalStateException("Lesson is not synced with Stepik. Lesson ID: " + lessonId);
        }
        Lesson lesson = mapToLesson(lessonDTO);
        log.info("Mapped lesson for Stepik update: ModelId={}, Title='{}', Position={}", 
                lesson.getModel().getId(), lesson.getTitle(), lesson.getPosition());
        
        try {
            StepikLessonResponse response = stepikLessonService.updateLesson(lessonDTO.getStepikLessonId(), lesson);
            StepikLessonResponseData lessonData = response.getLesson();
            
            if (lessonData == null) {
                log.error("Received null lesson data from Stepik update response");
                throw new StepikLessonIntegrationException("No lesson data received from Stepik update");
            }
            Long newStepikLessonId = lessonData.getId();
            if (newStepikLessonId == null) {
                log.error("Stepik returned null ID for lesson update. This may indicate the lesson was deleted or is inaccessible.");
                lessonService.updateLessonStepikLessonIdSetNull(lessonId);
                throw new IllegalStateException("Stepik returned null ID for lesson update. Local reference cleared.");
            }
            
            log.info("Lesson {} has units: {}", newStepikLessonId, lessonData.getUnits());
            
            if (!newStepikLessonId.equals(lessonDTO.getStepikLessonId())) {
                log.info("Stepik lesson ID changed from {} to {} for lesson {}", 
                        lessonDTO.getStepikLessonId(), newStepikLessonId, lessonId);
                lessonService.updateLessonStepikLessonId(lessonId, newStepikLessonId);
                log.info("Updated local lesson {} with new Stepik ID: {}", lessonId, newStepikLessonId);
            } else {
                log.info("Stepik lesson ID unchanged: {} for lesson {}", newStepikLessonId, lessonId);
            }

            log.info("Lesson {} successfully updated in Stepik with lesson ID: {}", lessonId, lessonData.getId());
            return lessonData;
        } catch (StepikLessonIntegrationException e) {
            if (e.getMessage().contains("404")) {
                log.warn("Lesson {} with stepikLessonId {} not found in Stepik API (404).", 
                        lessonId, lessonDTO.getStepikLessonId());
                throw new IllegalStateException("Lesson with Stepik ID " + lessonDTO.getStepikLessonId() + " not found in Stepik API (404).");
            }
            if (e.getMessage().contains("500")) {
                log.warn("Stepik server error (500) when updating lesson {}. This may indicate the lesson was deleted or is inaccessible.", lessonId);
                lessonService.updateLessonStepikLessonIdSetNull(lessonId);
                throw new IllegalStateException("Lesson with Stepik ID " + lessonDTO.getStepikLessonId() + " is not accessible in Stepik (server error 500). Local reference cleared.");
            }
            throw e;
        }
    }

    public LessonCaptchaChallenge getLessonSyncStatus(Long lessonId) {
        log.info("Getting sync status for lesson ID: {}", lessonId);
        
        LessonResponseDTO lessonDTO = lessonService.getLessonByLessonID(lessonId);
        
        LessonCaptchaChallenge result = LessonCaptchaChallenge.noCaptchaNeeded(lessonId);
        
        if (lessonDTO.getStepikLessonId() != null) {
            result.setCaptchaKey(lessonDTO.getStepikLessonId().toString());
            result.setMessage("Lesson is synced with Stepik (ID: " + lessonDTO.getStepikLessonId() + ")");
            log.info("Lesson {} is synced with Stepik ID: {}", lessonId, lessonDTO.getStepikLessonId());
        } else {
            result.setMessage("Lesson is not synced with Stepik");
            log.info("Lesson {} is not synced with Stepik", lessonId);
        }
        
        return result;
    }

    public void deleteLessonFromStepik(Long lessonId) {
        log.info("Starting deletion of lesson ID: {} from Stepik", lessonId);
        
        LessonResponseDTO lessonDTO = lessonService.getLessonByLessonID(lessonId);
        log.info("Lesson data: ID={}, Title='{}', StepikLessonId={}", 
                lessonDTO.getId(), lessonDTO.getTitle(), lessonDTO.getStepikLessonId());

        if (lessonDTO.getStepikLessonId() == null) {
            throw new IllegalStateException("Lesson is not synced with Stepik. Lesson ID: " + lessonId);
        }
        lessonService.updateLessonStepikLessonIdSetNull(lessonId);

        stepikLessonService.deleteLesson(lessonDTO.getStepikLessonId());
        log.info("Lesson {} successfully deleted from Stepik with lesson ID: {}", lessonId, lessonDTO.getStepikLessonId());
    }

    private Lesson mapToLesson(LessonResponseDTO lessonDTO) {
        Lesson lesson = new Lesson();
        lesson.setId(lessonDTO.getId());
        lesson.setTitle(lessonDTO.getTitle());
        lesson.setDescription(lessonDTO.getDescription());
        lesson.setPosition(lessonDTO.getPosition());
        lesson.setStepikLessonId(lessonDTO.getStepikLessonId());
        
        if (lessonDTO.getModelId() != null) {
            try {
                ModelResponseDTO modelDTO = modelService.getModelBuModelId(lessonDTO.getModelId());
                Model model = new Model();
                model.setId(modelDTO.getId());
                model.setStepikSectionId(modelDTO.getStepikSectionId());
                lesson.setModel(model);
                log.info("Mapped lesson {} to model {} with stepikSectionId: {}", 
                        lessonDTO.getId(), modelDTO.getId(), modelDTO.getStepikSectionId());
            } catch (Exception e) {
                log.error("Failed to get model data for lesson {}: {}", lessonDTO.getId(), e.getMessage());
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
        
        if (lesson.getModel() != null && lesson.getModel().getStepikSectionId() != null) {
            try {
                log.info("Creating unit for lesson {} in section {}", stepikLessonId, lesson.getModel().getStepikSectionId());
                stepikUnitService.createUnit(stepikLessonId, lesson.getModel().getStepikSectionId(), lesson.getPosition());
                log.info("Successfully created unit for lesson {} in section {}", stepikLessonId, lesson.getModel().getStepikSectionId());
            } catch (Exception e) {
                log.error("Failed to create unit for lesson {} in section {}: {}", 
                        stepikLessonId, lesson.getModel().getStepikSectionId(), e.getMessage());
            }
        } else {
            log.warn("Cannot create unit for lesson {}: model or stepikSectionId is null", stepikLessonId);
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

    public List<LessonResponseDTO> syncAllSectionLessonsFromStepik(Long modelId) {
        return syncAllSectionLessonsFromStepikService.syncAllSectionLessonsFromStepik(modelId);
    }
}
