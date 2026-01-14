package org.core.util;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Section;
import org.core.dto.stepik.section.StepikSectionRequestData;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikSectionRequestDataBuilder {

    public StepikSectionRequestData createRequestDataForCreation(Section section){
        StepikSectionRequestData requestData = new StepikSectionRequestData();
        requestData.setCourse(String.valueOf(section.getCourse().getStepikCourseId()));
        requestData.setTitle(section.getTitle());
        requestData.setDescription(section.getDescription() != null ? section.getDescription() : "");
        requestData.setPosition(section.getPosition());

        log.info("Created request data for creation: StepikCourseId={}, Title='{}', Description='{}', Position={}",
                requestData.getCourse(), requestData.getTitle(), requestData.getDescription(), requestData.getPosition());

        return requestData;
    }

    public StepikSectionRequestData createRequestDataForUpdate(Section section){
        StepikSectionRequestData requestData = new StepikSectionRequestData();
        
        if (section.getStepikSectionId() == null) {
            log.error("Section {} does not have stepikSectionId! Cannot update section in Stepik.", section.getId());
            throw new IllegalArgumentException("Section does not have stepikSectionId");
        }
        
        requestData.setId(section.getStepikSectionId());
        requestData.setCourse(String.valueOf(section.getCourse().getStepikCourseId()));
        requestData.setTitle(section.getTitle());
        requestData.setDescription(section.getDescription() != null ? section.getDescription() : "");
        requestData.setPosition(section.getPosition());

        String slug = section.getTitle() != null ?
                section.getTitle().toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + section.getId() :
                "section-" + section.getId();
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
