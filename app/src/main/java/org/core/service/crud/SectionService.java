package org.core.service.crud;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.domain.Section;
import org.core.dto.section.CreateSectionDTO;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.section.UpdateSectionDTO;
import org.core.exception.exceptions.CourseNotFoundException;
import org.core.exception.exceptions.SectionNotFoundException;
import org.core.repository.CourseRepository;
import org.core.repository.SectionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class SectionService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;

    public SectionResponseDTO createSection(CreateSectionDTO createDTO){
        Course course = courseRepository.findById(createDTO.getCourseId())
                .orElseThrow(() -> new CourseNotFoundException("Course not found"));
        
        Integer position = getNextPosition(course.getId());

        Section section = new Section();
        section.setCourse(course);
        section.setPosition(position);
        section.setTitle(createDTO.getTitle());
        section.setDescription(createDTO.getDescription());

        log.info("Created new section with ID: {} in course: {} at position {}", section.getId(), course.getId(), position);
        return mapToResponseDTO(sectionRepository.save(section));
    }

    public Section createSectionFromDTO(SectionResponseDTO sectionResponseDTO){
        Course course = courseRepository.findById(sectionResponseDTO.getCourseId())
                .orElseThrow(() -> new CourseNotFoundException("Course not found"));

        Section section = Section.builder()
                .course(course)
                .title(sectionResponseDTO.getTitle())
                .description(sectionResponseDTO.getDescription())
                .position(sectionResponseDTO.getPosition())
                .stepikSectionId(sectionResponseDTO.getStepikSectionId())
                .createdAt(sectionResponseDTO.getCreatedAt())
                .updatedAt(sectionResponseDTO.getUpdatedAt())
                .needsStepikSync(sectionResponseDTO.isNeedsStepikSync())
                .build();
        return sectionRepository.save(section);
    }

    public SectionResponseDTO getSectionBySectionId(Long sectionId){
        Section section = findSectionBySectionId(sectionId);
        return mapToResponseDTO(section);
    }

    public List<SectionResponseDTO> getCourseSectionsByCourseId(Long courseId){
        List<Section> sections = sectionRepository.findByCourseIdOrderByPositionAsc(courseId);
        return sections.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<SectionResponseDTO> getUnsyncedSectionsByCourseId(Long courseId){
        List<Section> unsyncedSections = sectionRepository.findByCourseIdAndStepikSectionIdIsNullOrderByPositionAsc(courseId);
        log.info("Found {} unsynced sections for course: {}", unsyncedSections.size(), courseId);
        return unsyncedSections.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public SectionResponseDTO updateSection(UpdateSectionDTO updateDTO){
        Section section = findSectionBySectionId(updateDTO.getSectionId());
        boolean contentChanged = false;
        if(updateDTO.getTitle() != null && !updateDTO.getTitle().equals(section.getTitle())){
            section.setTitle(updateDTO.getTitle());
            contentChanged = true;
        }
        if(updateDTO.getDescription() != null && !updateDTO.getDescription().equals(section.getDescription())){
            section.setDescription(updateDTO.getDescription());
            contentChanged = true;
        }
        if (updateDTO.getPosition() != null && !updateDTO.getPosition().equals(section.getPosition())){
            changeLessonPosition(section,updateDTO.getPosition());
            contentChanged = true;
        }
        if (section.getStepikSectionId() != null && contentChanged) {
            section.setNeedsStepikSync(true);
        }
        Section savedSection = sectionRepository.save(section);
        log.info("Updated section with ID: {}", updateDTO.getSectionId());
        return mapToResponseDTO(savedSection);
    }

    public void deleteSection(Long sectionId){
        Section section = findSectionBySectionId(sectionId);
        Long courseId = section.getCourse().getId();
        Integer position = section.getPosition();

        sectionRepository.delete(section);
        reorderLessonsAfterDeletion(courseId,position);

        log.info("Deleted section with ID: {} from course: {}", sectionId, courseId);
    }

    public void updateSectionStepikSectionId(Long sectionId, Long stepikSectionId) {
        Section section = findSectionBySectionId(sectionId);
        section.setStepikSectionId(stepikSectionId);
        section.setNeedsStepikSync(false);
        Section savedSection = sectionRepository.save(section);
        log.info("Updated section ID: {} with Stepik section ID: {}", sectionId, stepikSectionId);
        mapToResponseDTO(savedSection);
    }

    public void clearNeedsStepikSync(Long sectionId) {
        Section section = findSectionBySectionId(sectionId);
        if (section.isNeedsStepikSync()) {
            section.setNeedsStepikSync(false);
            sectionRepository.save(section);
            log.info("Cleared needsStepikSync for section ID: {}", sectionId);
        }
    }

    private Section findSectionBySectionId(Long sectionId){
        return sectionRepository.findById(sectionId)
                .orElseThrow(() -> new SectionNotFoundException("Section not found"));
    }

    private Integer getNextPosition(Long courseId) {
        return sectionRepository.findMaxPositionByCourseId(courseId)
                .map(pos -> pos + 1)
                .orElse(1);
    }

    private void shiftLessonsPositions(Long courseId, Integer fromPosition) {
        sectionRepository.incrementPositionsFromPosition(courseId, fromPosition);
    }

    private void changeLessonPosition(Section section, Integer newPosition) {
        Long courseId = section.getCourse().getId();
        Integer oldPosition = section.getPosition();
        if (newPosition < oldPosition) {
            sectionRepository.incrementPositionsRange(courseId, newPosition, oldPosition - 1);
        } else if (newPosition > oldPosition) {
            sectionRepository.decrementPositionsRange(courseId, oldPosition + 1, newPosition);
        }
        section.setPosition(newPosition);
    }

    private void reorderLessonsAfterDeletion(Long courseId, Integer deletedPosition) {
        sectionRepository.decrementPositionsFromPosition(courseId, deletedPosition);
    }

    private SectionResponseDTO mapToResponseDTO(Section section){
        return SectionResponseDTO.builder()
                .id(section.getId())
                .title(section.getTitle())
                .description(section.getDescription())
                .position(section.getPosition())
                .courseId(section.getCourse().getId())
                .stepikSectionId(section.getStepikSectionId())
                .createdAt(section.getCreatedAt())
                .updatedAt(section.getUpdatedAt())
                .needsStepikSync(section.isNeedsStepikSync())
                .build();
    }

}
