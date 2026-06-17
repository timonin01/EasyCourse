package org.core.service.stepik.section;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Section;
import org.core.domain.Course;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.section.UpdateSectionDTO;
import org.core.dto.stepik.section.StepikSectionResponseData;

import org.core.exception.exceptions.StepikSectionIntegrationException;
import org.core.repository.SectionRepository;
import org.core.service.crud.SectionService;
import org.core.service.crud.CourseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class UpdateStepikSectionService {

    private final SectionService sectionService;
    private final CourseService courseService;
    private final StepikSectionService stepikSectionService;
    private final SectionRepository sectionRepository;

    @Transactional
    public StepikSectionResponseData performStepikPositionShift(Section section, Long courseId, Integer newPosition) {
        if (section.getStepikSectionId() == null) {
            throw new StepikSectionIntegrationException("Section must have stepikSectionId for position shift");
        }

        List<SectionResponseDTO> sectionsByCourse = sectionService.getCourseSectionsByCourseId(courseId).stream()
                .filter(s -> s.getStepikSectionId() != null && !section.getId().equals(s.getId()))
                .toList();

        StepikSectionResponseData currentSectionData = stepikSectionService.getSectionByStepikId(section.getStepikSectionId());

        Integer oldPosition = currentSectionData.getPosition();
        if(newPosition < oldPosition){
            sectionRepository.incrementPositionsRange(courseId, newPosition, oldPosition - 1);
            shiftStepsDownInStepik(sectionsByCourse, newPosition, oldPosition - 1);
            section.setPosition(newPosition);
            sectionService.updateSection(createUpdateDTO(section.getId(), newPosition));
            stepikSectionService.updateSection(section);
        } else if (newPosition > oldPosition) {
            sectionRepository.decrementPositionsRange(courseId, oldPosition + 1, newPosition);
            shiftStepsUpInStepik(sectionsByCourse, oldPosition + 1, newPosition);
            section.setPosition(newPosition);
            sectionService.updateSection(createUpdateDTO(section.getId(), newPosition));
            stepikSectionService.updateSection(section);
        } else {
            sectionService.updateSection(createUpdateDTO(section.getId(), newPosition));
            stepikSectionService.updateSection(section);
        }

        return stepikSectionService.getSectionByStepikId(section.getStepikSectionId());
    }

    private void shiftStepsDownInStepik(List<SectionResponseDTO> sections, Integer fromPosition, Integer toPosition) {
        for (SectionResponseDTO sectionDTO : sections) {
            try {
                StepikSectionResponseData stepikData = stepikSectionService.getSectionByStepikId(sectionDTO.getStepikSectionId());
                Integer originalPosition = stepikData.getPosition();

                if (originalPosition >= fromPosition && originalPosition <= toPosition) {

                    Integer newPosition = originalPosition + 1;
                    log.info("Updating section {} position in Stepik from {} to {}",
                            sectionDTO.getId(), originalPosition, newPosition);

                    Section sectionForUpdate = mapToSection(sectionDTO);
                    sectionForUpdate.setPosition(newPosition);
                    stepikSectionService.updateSection(sectionForUpdate);
                }
            } catch (Exception e) {
                log.warn("Section {} not found in Stepik (sectionStepId: {}), skipping: {}",
                        sectionDTO.getId(), sectionDTO.getStepikSectionId(), e.getMessage());
            }
        }
    }

    private void shiftStepsUpInStepik(List<SectionResponseDTO> sections, Integer fromPosition, Integer toPosition) {
        for (SectionResponseDTO sectionDTO : sections) {
            try {
                StepikSectionResponseData stepikData = stepikSectionService.getSectionByStepikId(sectionDTO.getStepikSectionId());
                Integer originalPosition = stepikData.getPosition();

                if (originalPosition >= fromPosition && originalPosition <= toPosition) {

                    Integer newPosition = originalPosition - 1;
                    log.info("Updating section {} position in Stepik from {} to {}",
                            sectionDTO.getId(), originalPosition, newPosition);

                    Section sectionForUpdate = mapToSection(sectionDTO);
                    sectionForUpdate.setPosition(newPosition);
                    stepikSectionService.updateSection(sectionForUpdate);
                }
            } catch (Exception e) {
                log.warn("Section {} not found in Stepik (sectionStepId: {}), skipping: {}",
                        sectionDTO.getId(), sectionDTO.getStepikSectionId(), e.getMessage());
            }
        }
    }

    @Transactional
    public void performStepikPositionShiftAfterDeletion(Long courseId, Integer deletedPosition) {
        List<SectionResponseDTO> sections = sectionService.getCourseSectionsByCourseId(courseId).stream()
                .filter(s -> s.getStepikSectionId() != null)
                .filter(s -> s.getPosition() > deletedPosition)
                .toList();

        for(SectionResponseDTO sectionDTO : sections){
            StepikSectionResponseData sectionData = stepikSectionService.getSectionByStepikId(sectionDTO.getStepikSectionId());
            Integer currentPosition = sectionDTO.getPosition();
            Integer newPosition = currentPosition - 1;

            log.info("Shifting section {} in Stepik from position {} to {}",
                    sectionDTO.getId(), currentPosition, newPosition);

            sectionService.updateSection(createUpdateDTO(sectionDTO.getId(),newPosition));
            Section sectionForUpdate = mapToSection(sectionDTO);
            sectionForUpdate.setPosition(newPosition);
            stepikSectionService.updateSection(sectionForUpdate);
        }
    }

    private UpdateSectionDTO createUpdateDTO(Long sectionId, Integer newPosition) {
        UpdateSectionDTO updateSectionDTO = new UpdateSectionDTO();
        updateSectionDTO.setSectionId(sectionId);
        updateSectionDTO.setPosition(newPosition);
        return updateSectionDTO;
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
        course.setId(courseDTO.getId());
        course.setStepikCourseId(courseDTO.getStepikCourseId());
        section.setCourse(course);
        return section;
    }

}
