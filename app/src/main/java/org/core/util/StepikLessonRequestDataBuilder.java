package org.core.util;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.dto.stepik.lesson.StepikLessonRequestData;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikLessonRequestDataBuilder {

    @Value("${stepik.api.owner-id}")
    private String ownerId;

    public StepikLessonRequestData createRequestDataForCreate(Lesson lesson) {
        return createRequestDataForCreate(lesson, null);
    }

    public StepikLessonRequestData createRequestDataForCreate(Lesson lesson, String captchaToken) {
        StepikLessonRequestData requestData = new StepikLessonRequestData();
        requestData.setTitle(lesson.getTitle());
        requestData.setLanguage("ru");
        requestData.setIsPublic(true);
        requestData.setIsCommentsEnabled(true);
        requestData.setIsFeatured(false);
        requestData.setIsBlank(false);
        requestData.setIsDraft(false);
        requestData.setIsOrphaned(false);
        requestData.setIsExamWithoutProgress(false);
        requestData.setHasProgress(false);
        requestData.setOwner(ownerId);
        
        if (captchaToken != null && !captchaToken.trim().isEmpty()) {
            requestData.setCaptcha(captchaToken);
        }
        log.info("Created request data for create: Title='{}', Language='{}', Owner='{}', IsPublic={}, Captcha='{}'", 
                requestData.getTitle(), requestData.getLanguage(), requestData.getOwner(), 
                requestData.getIsPublic(), requestData.getCaptcha() != null ? "present" : "absent");
        return requestData;
    }

    public StepikLessonRequestData createRequestDataForUpdate(Lesson lesson) {
        StepikLessonRequestData requestData = new StepikLessonRequestData();
        if (lesson.getStepikLessonId() == null) {
            log.error("Lesson {} does not have stepikLessonId! Cannot update lesson in Stepik.", lesson.getId());
            throw new IllegalArgumentException("Lesson does not have stepikLessonId");
        }
        requestData.setId(lesson.getStepikLessonId());
        requestData.setTitle(lesson.getTitle());
        requestData.setLanguage("ru");
        requestData.setIsPublic(true);
        requestData.setIsCommentsEnabled(true);
        requestData.setIsFeatured(false);
        requestData.setIsBlank(false);
        requestData.setIsDraft(false);
        requestData.setIsOrphaned(false);
        requestData.setIsExamWithoutProgress(false);
        requestData.setHasProgress(false);
        requestData.setOwner(ownerId);

        log.info("Created request data for update: ID={}, Title='{}', Language='{}', Owner='{}', IsPublic={}", 
                requestData.getId(), requestData.getTitle(), requestData.getLanguage(), requestData.getOwner(), requestData.getIsPublic());
        
        return requestData;
    }
}
