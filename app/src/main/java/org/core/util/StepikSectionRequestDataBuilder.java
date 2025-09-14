package org.core.util;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Model;
import org.core.dto.stepik.section.StepikSectionRequestData;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikSectionRequestDataBuilder {

    public StepikSectionRequestData createRequestDataForCreation(Model model){
        StepikSectionRequestData requestData = new StepikSectionRequestData();
        requestData.setCourse(String.valueOf(model.getCourse().getStepikCourseId()));
        requestData.setTitle(model.getTitle());
        requestData.setDescription(model.getDescription() != null ? model.getDescription() : "");
        requestData.setPosition(model.getPosition());

        log.info("Created request data for creation: StepikCourseId={}, Title='{}', Description='{}', Position={}",
                requestData.getCourse(), requestData.getTitle(), requestData.getDescription(), requestData.getPosition());

        return requestData;
    }

    public StepikSectionRequestData createRequestDataForUpdate(Model model){
        StepikSectionRequestData requestData = new StepikSectionRequestData();
        
        // ВАЖНО: Проверяем, что stepikSectionId не null
        if (model.getStepikSectionId() == null) {
            log.error("Model {} does not have stepikSectionId! Cannot update section in Stepik.", model.getId());
            throw new IllegalArgumentException("Model does not have stepikSectionId");
        }
        
        requestData.setId(model.getStepikSectionId());
        requestData.setCourse(String.valueOf(model.getCourse().getStepikCourseId()));
        requestData.setTitle(model.getTitle());
        requestData.setDescription(model.getDescription() != null ? model.getDescription() : "");
        requestData.setPosition(model.getPosition());

        String slug = model.getTitle() != null ?
                model.getTitle().toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + model.getId() :
                "section-" + model.getId();
        requestData.setSlug(slug);

        requestData.setGradingPolicy("halved");
        requestData.setHasProgress(true);
        requestData.setDiscountingPolicy("no_discount");
        requestData.setRequiredPercent(100);
        requestData.setIsExam(false);
        requestData.setIsExamWithoutProgress(false);
        requestData.setIsRandomExam(false);
        requestData.setRandomExamProblemsCount(20);
        requestData.setHasProctorSession(false);
        requestData.setIsRequirementSatisfied(true);
        requestData.setIsProctoringCanBeScheduled(false);
        requestData.setExamDurationMinutes(120);

        log.info("Created request data for update: StepikSectionId={}, StepikCourseId={}, Title='{}', Description='{}', Position={}, Slug='{}'",
                requestData.getId(), requestData.getCourse(), requestData.getTitle(), requestData.getDescription(),
                requestData.getPosition(), requestData.getSlug());

        return requestData;
    }
}
