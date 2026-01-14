package org.core.service;

import org.core.domain.*;
import org.core.dto.lesson.CreateLessonDTO;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.lesson.UpdateLessonDTO;
import org.core.exception.exceptions.LessonNotFoundException;
import org.core.exception.exceptions.ModelNotFoundException;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.core.service.crud.LessonService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LessonServiceTest {

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private SectionRepository sectionRepository;

    @InjectMocks
    private LessonService lessonService;

    private User testUser;
    private Course testCourse;
    private Section testSection;
    private Lesson testLesson;

    @BeforeEach
    void setUp() {
        testUser = createTestUser();
        testCourse = createTestCourse();
        testSection = createTestModel();
        testLesson = createTestLesson();
    }

    private User createTestUser() {
        return User.builder()
                .id(1L)
                .name("Test User")
                .email("test@example.com")
                .password("password")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private Course createTestCourse() {
        return Course.builder()
                .id(1L)
                .title("Test Course")
                .description("Test Description")
                .author(testUser)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private Section createTestModel() {
        return Section.builder()
                .id(1L)
                .title("Test Model")
                .description("Test Description")
                .course(testCourse)
                .position(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private Lesson createTestLesson() {
        return createTestLesson(1L, 1);
    }

    private Lesson createTestLesson(Long id, Integer position) {
        return Lesson.builder()
                .id(id)
                .title("Test Lesson")
                .description("Test Description")
                .model(testSection)
                .position(position)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createLessonCorrect() {
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(testSection));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(testLesson);

        CreateLessonDTO createDTO = new CreateLessonDTO(1L, "Test Lesson", "Test Description", 1);
        LessonResponseDTO result = lessonService.createLesson(createDTO);

        assertThat(result.getTitle()).isEqualTo("Test Lesson");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getModelId()).isEqualTo(1L);
        assertThat(result.getPosition()).isEqualTo(1);

        verify(sectionRepository).findById(1L);
        verify(lessonRepository).save(any(Lesson.class));
        verify(lessonRepository).incrementPositionsFromPosition(1L, 1);
    }

    @Test
    void createLessonWithNullPosition() {
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(testSection));
        when(lessonRepository.findMaxPositionByModelId(1L)).thenReturn(Optional.of(2));
        
        Lesson lessonWithAutoPosition = createTestLesson(1L, 3);
        when(lessonRepository.save(any(Lesson.class))).thenReturn(lessonWithAutoPosition);

        CreateLessonDTO createDTO = new CreateLessonDTO(1L, "Test Lesson", "Test Description", null);
        LessonResponseDTO result = lessonService.createLesson(createDTO);

        assertThat(result.getPosition()).isEqualTo(3);
        verify(lessonRepository).findMaxPositionByModelId(1L);
        verify(lessonRepository, never()).incrementPositionsFromPosition(any(), any());
    }

    @Test
    void createLessonModelNotExists() {
        when(sectionRepository.findById(999L)).thenReturn(Optional.empty());

        CreateLessonDTO createDTO = new CreateLessonDTO(999L, "Test Lesson", "Test Description", 1);

        assertThatThrownBy(() -> lessonService.createLesson(createDTO))
                .isInstanceOf(ModelNotFoundException.class)
                .hasMessage("Model not found");

        verify(sectionRepository).findById(999L);
        verify(lessonRepository, never()).save(any(Lesson.class));
    }

    @Test
    void getLessonByLessonIdSuccessful() {
        when(lessonRepository.findById(1L)).thenReturn(Optional.of(testLesson));

        LessonResponseDTO result = lessonService.getLessonByLessonID(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Test Lesson");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getModelId()).isEqualTo(1L);

        verify(lessonRepository).findById(1L);
    }

    @Test
    void getLessonByLessonIdNotFound() {
        when(lessonRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> lessonService.getLessonByLessonID(999L))
                .isInstanceOf(LessonNotFoundException.class)
                .hasMessage("Lesson not found");

        verify(lessonRepository).findById(999L);
    }

    @Test
    void getSectionLessonsBySectionIdSuccessful() {
        List<Lesson> lessons = Arrays.asList(testLesson);
        when(lessonRepository.findByModelIdOrderByPositionAsc(1L)).thenReturn(lessons);

        List<LessonResponseDTO> result = lessonService.getSectionLessonsBySectionId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Test Lesson");
        assertThat(result.get(0).getModelId()).isEqualTo(1L);

        verify(lessonRepository).findByModelIdOrderByPositionAsc(1L);
    }

    @Test
    void getSectionLessonsBySectionIdEmptyList() {
        when(lessonRepository.findByModelIdOrderByPositionAsc(1L)).thenReturn(Arrays.asList());

        List<LessonResponseDTO> result = lessonService.getSectionLessonsBySectionId(1L);

        assertThat(result).isEmpty();
        verify(lessonRepository).findByModelIdOrderByPositionAsc(1L);
    }

    @Test
    void updateLessonSuccessful() {
        UpdateLessonDTO updateDTO = new UpdateLessonDTO();
        updateDTO.setLessonId(1L);
        updateDTO.setTitle("Updated Title");
        updateDTO.setDescription("Updated Description");

        when(lessonRepository.findById(1L)).thenReturn(Optional.of(testLesson));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(testLesson);

        LessonResponseDTO result = lessonService.updateLesson(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getDescription()).isEqualTo("Updated Description");

        verify(lessonRepository).findById(1L);
        verify(lessonRepository).save(any(Lesson.class));
    }

    @Test
    void updateLessonOnlyTitle() {
        UpdateLessonDTO updateDTO = new UpdateLessonDTO();
        updateDTO.setLessonId(1L);
        updateDTO.setTitle("Updated Title");

        when(lessonRepository.findById(1L)).thenReturn(Optional.of(testLesson));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(testLesson);

        LessonResponseDTO result = lessonService.updateLesson(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getDescription()).isEqualTo("Test Description");

        verify(lessonRepository).findById(1L);
        verify(lessonRepository).save(any(Lesson.class));
    }

    @Test
    void updateLessonOnlyDescription() {
        UpdateLessonDTO updateDTO = new UpdateLessonDTO();
        updateDTO.setLessonId(1L);
        updateDTO.setDescription("Updated Description");

        when(lessonRepository.findById(1L)).thenReturn(Optional.of(testLesson));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(testLesson);

        LessonResponseDTO result = lessonService.updateLesson(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Test Lesson");
        assertThat(result.getDescription()).isEqualTo("Updated Description");

        verify(lessonRepository).findById(1L);
        verify(lessonRepository).save(any(Lesson.class));
    }

    @Test
    void updateLessonWithPositionChangeForward() {
        UpdateLessonDTO updateDTO = new UpdateLessonDTO();
        updateDTO.setLessonId(1L);
        updateDTO.setPosition(3);

        when(lessonRepository.findById(1L)).thenReturn(Optional.of(testLesson));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(testLesson);

        LessonResponseDTO result = lessonService.updateLesson(updateDTO);

        assertThat(result.getPosition()).isEqualTo(3);
        verify(lessonRepository).decrementPositionsRange(1L, 2, 3);
    }

    @Test
    void updateLessonWithPositionChangeBackward() {
        Lesson lessonAtPosition3 = createTestLesson(1L, 3);
        UpdateLessonDTO updateDTO = new UpdateLessonDTO();
        updateDTO.setLessonId(1L);
        updateDTO.setPosition(1);

        when(lessonRepository.findById(1L)).thenReturn(Optional.of(lessonAtPosition3));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(lessonAtPosition3);

        LessonResponseDTO result = lessonService.updateLesson(updateDTO);

        assertThat(result.getPosition()).isEqualTo(1);
        verify(lessonRepository).incrementPositionsRange(1L, 1, 2);
    }

    @Test
    void updateLessonNotFound() {
        UpdateLessonDTO updateDTO = new UpdateLessonDTO();
        updateDTO.setLessonId(999L);
        updateDTO.setTitle("Updated Title");

        when(lessonRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> lessonService.updateLesson(updateDTO))
                .isInstanceOf(LessonNotFoundException.class)
                .hasMessage("Lesson not found");

        verify(lessonRepository).findById(999L);
        verify(lessonRepository, never()).save(any(Lesson.class));
    }

    @Test
    void deleteLessonSuccessful() {
        when(lessonRepository.findById(1L)).thenReturn(Optional.of(testLesson));

        lessonService.deleteLesson(1L);

        verify(lessonRepository).findById(1L);
        verify(lessonRepository).delete(testLesson);
        verify(lessonRepository).decrementPositionsFromPosition(1L, 1);
    }

    @Test
    void deleteLessonNotFound() {
        when(lessonRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> lessonService.deleteLesson(999L))
                .isInstanceOf(LessonNotFoundException.class)
                .hasMessage("Lesson not found");

        verify(lessonRepository).findById(999L);
        verify(lessonRepository, never()).delete(any(Lesson.class));
    }
}
