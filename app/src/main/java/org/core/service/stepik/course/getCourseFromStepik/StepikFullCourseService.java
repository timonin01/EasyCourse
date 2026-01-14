package org.core.service.stepik.course.getCourseFromStepik;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.stepik.FullCourseResponseDTO;
import org.core.dto.stepik.course.StepikCourseResponseData;
import org.core.exception.exceptions.CourseNotFoundException;
import org.core.repository.CourseRepository;
import org.core.service.stepik.course.StepikCourseService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StepikFullCourseService {

    private final StepikCourseService stepikCourseService;
    private final FullCourseDataService dataService;
    private final StepikFullCourseSaveService saveService;

    private final CourseRepository courseRepository;

    public FullCourseResponseDTO buildFullCourseResponseDTO(Long stepikCourseId, Long userId){
        StepikCourseResponseData stepikCourseResponseData = stepikCourseService.getCourse(stepikCourseId);
        if(stepikCourseResponseData == null){
            throw new CourseNotFoundException("Not found course with stepikCourseId: " + stepikCourseId);
        }

        List<SectionResponseDTO> sectionResponseDTOS = dataService.getSectionsResponseDTO(stepikCourseId, userId);
        List<LessonResponseDTO> lessonsResponseDTOS = dataService.getLessonsResponseDTO(sectionResponseDTOS, userId);
        List<StepResponseDTO> stepResponseDTOS = dataService.getStepResponseDTO(lessonsResponseDTOS, userId);

        Course existingCourse = courseRepository.findByStepikCourseId(stepikCourseId);
        Long existingCourseId = existingCourse != null ? existingCourse.getId() : null;
        LocalDateTime existingCreatedAt = existingCourse != null ? existingCourse.getCreatedAt() : null;
        LocalDateTime existingUpdatedAt = existingCourse != null ? existingCourse.getUpdatedAt() : null;

        FullCourseResponseDTO fullCourseResponseDTO = FullCourseResponseDTO.builder()
                .id(existingCourseId)
                .userId(userId)
                .title(stepikCourseResponseData.getTitle())
                .description(stepikCourseResponseData.getDescription())
                .stepikCourseId(stepikCourseResponseData.getId())
                .createdAt(existingCreatedAt)
                .updatedAt(existingUpdatedAt)
                .models(sectionResponseDTOS)
                .lessons(lessonsResponseDTOS)
                .steps(stepResponseDTOS)
                .build();
        saveService.saveCourseFromStepik(fullCourseResponseDTO);

        Course savedCourse = courseRepository.findByStepikCourseId(stepikCourseId);
        if (savedCourse != null) {
            fullCourseResponseDTO.setId(savedCourse.getId());
            fullCourseResponseDTO.setCreatedAt(savedCourse.getCreatedAt());
            fullCourseResponseDTO.setUpdatedAt(savedCourse.getUpdatedAt());
        }
        return fullCourseResponseDTO;
    }
}
