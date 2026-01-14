package org.core.service.stepik.course.getCourseFromStepik;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.stepik.FullCourseResponseDTO;
import org.core.repository.CourseRepository;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.core.repository.StepRepository;
import org.core.service.crud.CourseService;
import org.core.service.crud.LessonService;
import org.core.service.crud.SectionService;
import org.core.service.crud.StepService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class StepikFullCourseSaveService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final StepRepository stepRepository;
    private final CourseService courseService;
    private final SectionService sectionService;
    private final LessonService lessonService;
    private final StepService stepService;

    public void saveCourseFromStepik(FullCourseResponseDTO courseResponseDTO){
        try {
            log.info("Starting to save course from Stepik. Course ID: {}, Models: {}, Lessons: {}, Steps: {}", 
                    courseResponseDTO.getStepikCourseId(), 
                    courseResponseDTO.getModels().size(),
                    courseResponseDTO.getLessons().size(),
                    courseResponseDTO.getSteps().size());
            
            Course course = getOrCreateCourse(courseResponseDTO);
            log.info("Course created/updated with ID: {}", course.getId());

            course.getSections().clear();
            for(SectionResponseDTO sectionDTO : courseResponseDTO.getModels()) {
                sectionDTO.setCourseId(course.getId());
                Section section = getOrCreateSection(sectionDTO);
                log.debug("Processing section: {} (ID: {})", section.getTitle(), section.getId());
                section.getLessons().clear();

                for (LessonResponseDTO lessonDTO : courseResponseDTO.getLessons()) {
                    if (lessonDTO.getStepikSectionId() == null || !lessonDTO.getStepikSectionId().equals(sectionDTO.getStepikSectionId())) {
                        continue;
                    }
                    
                    lessonDTO.setSectionId(section.getId());
                    Lesson lesson = getOrCreateLesson(lessonDTO);
                    log.debug("Processing lesson: {} (ID: {})", lesson.getTitle(), lesson.getId());
                    lesson.getSteps().clear();
                    for (StepResponseDTO stepDTO : courseResponseDTO.getSteps()) {
                        if (stepDTO.getLessonId() != null && stepDTO.getLessonId().equals(lesson.getStepikLessonId())) {
                            stepDTO.setLessonId(lesson.getId());
                            Step step = getOrCreateStep(stepDTO);
                            lesson.getSteps().add(step);
                        }
                    }
                    section.getLessons().add(lesson);
                }
                course.getSections().add(section);
            }
            log.info("Saving course with {} sections", course.getSections().size());
            courseRepository.save(course);
            log.info("Course successfully saved with ID: {}", course.getId());
        } catch (Exception e) {
            log.error("Error saving course from Stepik: {}", e.getMessage(), e);
            throw e;
        }
    }

    private Course getOrCreateCourse(FullCourseResponseDTO courseResponseDTO) {
        Course existingCourse = courseResponseDTO.getStepikCourseId() != null
                ? courseRepository.findByStepikCourseId(courseResponseDTO.getStepikCourseId()) : null;

        if (existingCourse != null) {
            existingCourse.setTitle(courseResponseDTO.getTitle());
            existingCourse.setDescription(courseResponseDTO.getDescription());
            existingCourse.setUpdatedAt(courseResponseDTO.getUpdatedAt() != null ? courseResponseDTO.getUpdatedAt() : LocalDateTime.now());
            return courseRepository.save(existingCourse);
        }
        else return courseService.createCourseFromDTO(courseResponseDTO);
    }

    private Section getOrCreateSection(SectionResponseDTO sectionDTO) {
        Section existingSection = sectionDTO.getStepikSectionId() != null
                ? sectionRepository.findByStepikSectionId(sectionDTO.getStepikSectionId()) : null;

        if (existingSection != null) {
            existingSection.setTitle(sectionDTO.getTitle());
            existingSection.setDescription(sectionDTO.getDescription());
            existingSection.setPosition(sectionDTO.getPosition());
            if (existingSection.getCourse().getId() != sectionDTO.getCourseId()) {
                existingSection.setCourse(courseRepository.findById(sectionDTO.getCourseId())
                        .orElseThrow(() -> new org.core.exception.exceptions.CourseNotFoundException("Course not found")));
            }
            existingSection.setUpdatedAt(sectionDTO.getUpdatedAt() != null ? sectionDTO.getUpdatedAt() : LocalDateTime.now());
            return sectionRepository.save(existingSection);
        }
        else return sectionService.createSectionFromDTO(sectionDTO);
    }

    private Lesson getOrCreateLesson(LessonResponseDTO lessonDTO) {
        Lesson existingLesson = lessonDTO.getStepikLessonId() != null
                ? lessonRepository.findByStepikLessonId(lessonDTO.getStepikLessonId()) : null;

        if (existingLesson != null) {
            existingLesson.setTitle(lessonDTO.getTitle());
            existingLesson.setPosition(lessonDTO.getPosition());
            if (existingLesson.getSection().getId() != lessonDTO.getSectionId()) {
                existingLesson.setSection(sectionRepository.findById(lessonDTO.getSectionId())
                        .orElseThrow(() -> new org.core.exception.exceptions.SectionNotFoundException("Section not found")));
            }
            existingLesson.setUpdatedAt(lessonDTO.getUpdatedAt() != null ? lessonDTO.getUpdatedAt() : LocalDateTime.now());
            return lessonRepository.save(existingLesson);
        }
        else return lessonService.createLessonFromDTO(lessonDTO);
    }

    private Step getOrCreateStep(StepResponseDTO stepDTO) {
        Step existingStep = stepDTO.getStepikStepId() != null
                ? stepRepository.findByStepikStepId(stepDTO.getStepikStepId()) : null;

        if (existingStep != null) {
            existingStep.setPosition(stepDTO.getPosition());
            existingStep.setType(stepDTO.getType());
            existingStep.setCost(stepDTO.getCost());
            existingStep.setContent(stepDTO.getContent());
            existingStep.setStepikBlockData(stepDTO.getStepikBlockJson());
            if (existingStep.getLesson().getId() != stepDTO.getLessonId()) {
                existingStep.setLesson(lessonRepository.findById(stepDTO.getLessonId())
                        .orElseThrow(() -> new org.core.exception.exceptions.LessonNotFoundException("Lesson not found")));
            }
            existingStep.setUpdatedAt(stepDTO.getUpdatedAt() != null ? stepDTO.getUpdatedAt() : LocalDateTime.now());
            return stepRepository.save(existingStep);
        }
        else return stepService.createStepFromDTO(stepDTO);
    }

}
