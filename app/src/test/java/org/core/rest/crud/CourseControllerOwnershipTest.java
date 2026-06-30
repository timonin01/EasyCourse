package org.core.rest.crud;

import org.core.context.UserContextBean;
import org.core.dto.course.CourseResponseDTO;
import org.core.exception.GlobalExceptionHandler;
import org.core.exception.exceptions.CourseDoesntBelongToUserException;
import org.core.exception.exceptions.ResourceAccessDeniedException;
import org.core.service.crud.CourseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CourseControllerOwnershipTest {

    @Mock
    private CourseService courseService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        CourseController controller = new CourseController(courseService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createCourseAcceptsBodyWithoutUserId() throws Exception {
        CourseResponseDTO response = CourseResponseDTO.builder()
                .id(10L)
                .userId(1L)
                .title("Course")
                .description("Desc")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        when(courseService.createCourse(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Course",
                                  "description": "Desc"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.userId").value(1));
    }

    @Test
    void getCourseByCourseIdReturnsForbiddenForNonOwner() throws Exception {
        when(courseService.getCourseByCourseId(10L))
                .thenThrow(new CourseDoesntBelongToUserException("Course does not belong to user"));

        mockMvc.perform(get("/api/v1/courses/10"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Course does not belong to user"));
    }

    @Test
    void updateCourseReturnsForbiddenForNonOwner() throws Exception {
        when(courseService.updateCourse(any()))
                .thenThrow(new CourseDoesntBelongToUserException("Course does not belong to user"));

        mockMvc.perform(put("/api/v1/courses/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": 10,
                                  "title": "Hacked"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteCourseReturnsForbiddenForNonOwner() throws Exception {
        doThrow(new CourseDoesntBelongToUserException("Course does not belong to user"))
                .when(courseService).deleteCourse(10L);

        mockMvc.perform(delete("/api/v1/courses/delete/10"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUserCoursesReturnsForbiddenForOtherUserId() throws Exception {
        when(courseService.getUserCoursesByUserId(2L))
                .thenThrow(new ResourceAccessDeniedException("You specify another user's ID in the request"));

        mockMvc.perform(get("/api/v1/courses/all_courses/2"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getCourseByCourseIdReturnsOkForOwner() throws Exception {
        CourseResponseDTO response = CourseResponseDTO.builder()
                .id(10L)
                .userId(1L)
                .title("Course")
                .description("Desc")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        when(courseService.getCourseByCourseId(eq(10L))).thenReturn(response);

        mockMvc.perform(get("/api/v1/courses/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }
}
