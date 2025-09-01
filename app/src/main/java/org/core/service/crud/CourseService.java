package org.core.service.crud;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.domain.User;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.course.CreateCourseDTO;
import org.core.dto.course.UpdateCourseDTO;
import org.core.exception.CourseNotFoundException;
import org.core.exception.UserNotFoundException;
import org.core.repository.CourseRepository;
import org.core.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class CourseService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public CourseResponseDTO createCourse(CreateCourseDTO createDTO){
        User user = userRepository.findById(createDTO.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        Course course = new Course();
        course.setAuthor(user);
        course.setTitle(createDTO.getTitle());
        course.setDescription(createDTO.getDescription());
        course.setTargetPlatform(createDTO.getTargetPlatform());

        log.info("Created new course with ID: {} at: {}", course.getId(), user.getId());
        return mapToResponseDTO(courseRepository.save(course));
    }

    public CourseResponseDTO getCourseByCourseId(Long courseId){
        Course course = findCourseByCourseId(courseId);
        return mapToResponseDTO(course);
    }

    public List<CourseResponseDTO> getUserCoursesByUserId(Long userId){
        List<Course> courses = courseRepository.findByAuthorId(userId);
        return courses.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public CourseResponseDTO updateCourse(UpdateCourseDTO updateDTO){
        Course course = findCourseByCourseId(updateDTO.getId());
        if(updateDTO.getTitle() != null){
            course.setTitle(updateDTO.getTitle());
        }
        if(updateDTO.getDescription() != null){
            course.setDescription(updateDTO.getDescription());
        }

        log.info("Updated course with ID: {}", updateDTO.getId());
        return mapToResponseDTO(courseRepository.save(course));
    }

    public void deleteCourse(Long courseId){
        Course course = findCourseByCourseId(courseId);

        courseRepository.delete(course);
        log.info("Delete course with ID: {} and userId: {}",course.getId(),course.getAuthor().getId());

    }

    private Course findCourseByCourseId(Long courseId){
        return courseRepository.findById(courseId)
                .orElseThrow(()->new CourseNotFoundException("Course not found"));
    }

    private CourseResponseDTO mapToResponseDTO(Course course){
        return CourseResponseDTO.builder()
                .id(course.getId())
                .userId(course.getAuthor().getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }

}
