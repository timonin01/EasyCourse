package org.core.rest.crud;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.course.CourseResponseDTO;
import org.core.dto.course.CreateCourseDTO;
import org.core.dto.course.UpdateCourseDTO;
import org.core.service.crud.CourseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class CourseController {

    private final CourseService courseService;

    @GetMapping("/{courseId}")
    public CourseResponseDTO getCourseByCourseId(@PathVariable Long courseId) {
        return courseService.getCourseByCourseId(courseId);
    }

    @GetMapping("/all_courses/{userId}")
    public List<CourseResponseDTO> getUserCoursesByUserId(@PathVariable Long userId) {
        return courseService.getUserCoursesByUserId(userId);
    }

    @PostMapping
    public CourseResponseDTO createCourse(@Valid  @RequestBody CreateCourseDTO createDTO) {
        return courseService.createCourse(createDTO);
    }

    @PutMapping("/update")
    public CourseResponseDTO updateCourse(@Valid @RequestBody UpdateCourseDTO updateDTO) {
        return courseService.updateCourse(updateDTO);
    }

    @DeleteMapping("/delete/{courseId}")
    public void deleteCourse(@PathVariable Long courseId) {
        courseService.deleteCourse(courseId);
    }
}
