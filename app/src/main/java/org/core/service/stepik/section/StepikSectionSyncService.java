package org.core.service.stepik.section;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Section;
import org.core.domain.Course;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.stepik.section.StepikSectionResponse;
import org.core.dto.stepik.section.StepikSectionResponseData;
import org.core.exception.exceptions.StepikLessonIntegrationException;
import org.core.exception.exceptions.StepikSectionIntegrationException;
import org.core.service.crud.SectionService;
import org.core.service.crud.CourseService;
import org.core.service.crud.LessonService;
import org.core.service.stepik.lesson.StepikLessonSyncService;
import org.core.dto.lesson.LessonResponseDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikSectionSyncService {

    private final StepikSectionService stepikSectionService;
    private final SectionService sectionService;
    private final CourseService courseService;
    private final LessonService lessonService;
    private final UpdateStepikSectionService updateStepikSectionService;
    private final StepikLessonSyncService stepikLessonSyncService;

    public StepikSectionResponseData syncSectionWithStepik(Long sectionId) {
        SectionResponseDTO sectionDTO = sectionService.getSectionBySectionId(sectionId);
        Section section = mapToSection(sectionDTO);

        StepikSectionResponse response = stepikSectionService.createSection(section);
        StepikSectionResponseData sectionData = response.getSection();
        if (sectionData != null) {
            sectionService.updateSectionStepikSectionId(sectionId, sectionData.getId());
            log.info("Section {} successfully synced with Stepik section ID: {}", sectionId, sectionData.getId());
            
            syncAllSectionLessons(sectionId);
        }
        return sectionData;
    }
    
    private void syncAllSectionLessons(Long sectionId) {
        List<LessonResponseDTO> lessons = lessonService.getSectionLessonsBySectionId(sectionId);
        log.info("Syncing {} lessons for section {}", lessons.size(), sectionId);
        
        for (LessonResponseDTO lesson : lessons) {
            try {
                if (lesson.getStepikLessonId() == null) {
                    log.info("Syncing lesson {} with Stepik", lesson.getId());
                    stepikLessonSyncService.syncLessonWithStepik(lesson.getId(), null);
                } else {
                    log.info("Lesson {} already synced with Stepik (ID: {}), skipping", lesson.getId(), lesson.getStepikLessonId());
                }
            } catch (Exception e) {
                log.error("Failed to sync lesson {} with Stepik: {}", lesson.getId(), e.getMessage(), e);
                // Продолжаем синхронизацию остальных уроков даже при ошибке
            }
        }
    }

    public StepikSectionResponseData updateSectionInStepik(Long sectionId) {
        SectionResponseDTO sectionDTO = sectionService.getSectionBySectionId(sectionId);
        if (sectionDTO.getStepikSectionId() == null) {
            throw new IllegalStateException("Section is not synced with Stepik. Section ID: " + sectionId);
        }

        StepikSectionResponseData sectionData = stepikSectionService.getSectionByStepikId(sectionDTO.getStepikSectionId());
        Integer currentDbPosition = sectionDTO.getPosition();
        Integer currentStepikPosition = sectionData.getPosition();

        if(currentDbPosition.equals(currentStepikPosition)){
            log.info("Positions match, performing simple update");
            Section section = mapToSection(sectionDTO);
            stepikSectionService.updateSection(section.getStepikSectionId());
            return stepikSectionService.getSectionByStepikId(sectionDTO.getStepikSectionId());
        }

        Section section = mapToSection(sectionDTO);
        section.setPosition(currentStepikPosition);
        try{
            updateStepikSectionService.performStepikPositionShift(section,sectionDTO.getCourseId(),currentDbPosition);
        }catch (StepikSectionIntegrationException e){
            log.error("Error updating section in Stepik : {}", e.getMessage());
            throw new StepikLessonIntegrationException("Failed to update section in Stepik: " + e.getMessage());
        }

        log.info("Section {} successfully updated in Stepik with section ID: {}", sectionId, sectionData.getId());
        return sectionData;
    }

    public void deleteSectionFromStepik(Long sectionId) {
        SectionResponseDTO sectionDTO = sectionService.getSectionBySectionId(sectionId);
        if (sectionDTO.getStepikSectionId() == null) {
            throw new IllegalStateException("Section is not synced with Stepik. Section ID: " + sectionId);
        }
        lessonService.clearStepikLessonIdsBySectionId(sectionId);

        updateStepikSectionService.performStepikPositionShiftAfterDeletion(sectionDTO.getCourseId(),sectionDTO.getPosition());

        stepikSectionService.deleteSection(sectionDTO.getStepikSectionId());
        sectionService.updateSectionStepikSectionId(sectionId, null);
        
        log.info("Section {} successfully deleted from Stepik and unlinked", sectionId);
    }

    private Section mapToSection(SectionResponseDTO sectionDTO) {
        Section section = new Section();
        section.setId(sectionDTO.getId());
        section.setTitle(sectionDTO.getTitle());
        section.setDescription(sectionDTO.getDescription());
        section.setPosition(sectionDTO.getPosition());
        section.setStepikSectionId(sectionDTO.getStepikSectionId());

        CourseResponseDTO courseDTO = courseService.getCourseByCourseId(sectionDTO.getCourseId());
        if (courseDTO.getStepikCourseId() == null) {
            throw new IllegalStateException("Course must be synced with Stepik before syncing sections. Course ID: " + courseDTO.getId());
        }
        Course course = new Course();
        course.setId(courseDTO.getStepikCourseId());
        course.setStepikCourseId(courseDTO.getStepikCourseId());
        section.setCourse(course);
        
        return section;
    }
}