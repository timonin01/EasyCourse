package org.core.service;

import org.core.domain.*;
import org.core.dto.step.CreateStepDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.step.UpdateStepDTO;
import org.core.exception.exceptions.LessonNotFoundException;
import org.core.exception.exceptions.StepNotFoundException;
import org.core.repository.LessonRepository;
import org.core.repository.StepRepository;
import org.core.service.crud.StepService;
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
class StepServiceTest {

    @Mock private StepRepository stepRepository;

    @Mock private LessonRepository lessonRepository;

    @InjectMocks private StepService stepService;

    private User testUser;
    private Course testCourse;
    private Model testModel;
    private Lesson testLesson;
    private Step testStep;

    @BeforeEach
    void setUp() {
        testUser = createTestUser();
        testCourse = createTestCourse();
        testModel = createTestModel();
        testLesson = createTestLesson();
        testStep = createTestStep();
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

    private Model createTestModel() {
        return Model.builder()
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
        return Lesson.builder()
                .id(1L)
                .title("Test Lesson")
                .description("Test Description")
                .model(testModel)
                .position(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private Step createTestStep() {
        return createTestStep(1L, 1);
    }

    private Step createTestStep(Long id, Integer position) {
        return Step.builder()
                .id(id)
                .type(StepType.TEXT)
                .content("Test Content")
                .lesson(testLesson)
                .position(position)
                .cost(1L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createStepCorrect() {
        when(lessonRepository.findById(1L)).thenReturn(Optional.of(testLesson));
        when(stepRepository.save(any(Step.class))).thenReturn(testStep);

        CreateStepDTO createDTO = new CreateStepDTO(1L, StepType.TEXT,"Test Content", 1, 1L);
        StepResponseDTO result = stepService.createStep(createDTO);

        assertThat(result.getType()).isEqualTo(StepType.TEXT);
        assertThat(result.getContent()).isEqualTo("Test Content");
        assertThat(result.getLessonId()).isEqualTo(1L);
        assertThat(result.getPosition()).isEqualTo(1);

        verify(lessonRepository).findById(1L);
        verify(stepRepository).save(any(Step.class));
        verify(stepRepository).incrementPositionsFrom(1L, 1);
    }

    @Test
    void createStepWithNullPosition() {
        when(lessonRepository.findById(1L)).thenReturn(Optional.of(testLesson));
        when(stepRepository.findMaxPositionByLessonId(1L)).thenReturn(2);

        Step stepWithAutoPosition = createTestStep(1L, 3);
        when(stepRepository.save(any(Step.class))).thenReturn(stepWithAutoPosition);

        CreateStepDTO createDTO = new CreateStepDTO(1L, StepType.TEXT,"Test Content", null,1L);
        StepResponseDTO result = stepService.createStep(createDTO);

        assertThat(result.getPosition()).isEqualTo(3);
        verify(stepRepository).findMaxPositionByLessonId(1L);
        verify(stepRepository, never()).incrementPositionsFrom(any(), any());
    }

    @Test
    void createStepLessonNotExists() {
        when(lessonRepository.findById(999L)).thenReturn(Optional.empty());

        CreateStepDTO createDTO = new CreateStepDTO(999L, StepType.TEXT,"Test Content", 1,1L);

        assertThatThrownBy(() -> stepService.createStep(createDTO))
                .isInstanceOf(LessonNotFoundException.class)
                .hasMessage("Lesson not found");

        verify(lessonRepository).findById(999L);
        verify(stepRepository, never()).save(any(Step.class));
    }

    @Test
    void createStepWithFirstPosition() {
        when(lessonRepository.findById(1L)).thenReturn(Optional.of(testLesson));
        when(stepRepository.findMaxPositionByLessonId(1L)).thenReturn(null);

        Step stepWithFirstPosition = createTestStep(1L, 1);
        when(stepRepository.save(any(Step.class))).thenReturn(stepWithFirstPosition);

        CreateStepDTO createDTO = new CreateStepDTO(1L, StepType.TEXT,"Test Content", null,1L);
        StepResponseDTO result = stepService.createStep(createDTO);

        assertThat(result.getPosition()).isEqualTo(1);
        verify(stepRepository).findMaxPositionByLessonId(1L);
        verify(stepRepository, never()).incrementPositionsFrom(any(), any());
    }

    @Test
    void getStepByIdSuccessful() {
        when(stepRepository.findById(1L)).thenReturn(Optional.of(testStep));

        StepResponseDTO result = stepService.getStepById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getType()).isEqualTo(StepType.TEXT);
        assertThat(result.getContent()).isEqualTo("Test Content");
        assertThat(result.getLessonId()).isEqualTo(1L);

        verify(stepRepository).findById(1L);
    }

    @Test
    void getStepByIdNotFound() {
        when(stepRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stepService.getStepById(999L))
                .isInstanceOf(StepNotFoundException.class)
                .hasMessage("Step not found");

        verify(stepRepository).findById(999L);
    }

    @Test
    void getLessonStepsByLessonIdSuccessful() {
        List<Step> steps = Arrays.asList(testStep);
        when(stepRepository.findByLessonIdOrderByPositionAsc(1L)).thenReturn(steps);

        List<StepResponseDTO> result = stepService.getLessonStepsByLessonId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getType()).isEqualTo(StepType.TEXT);
        assertThat(result.get(0).getLessonId()).isEqualTo(1L);

        verify(stepRepository).findByLessonIdOrderByPositionAsc(1L);
    }

    @Test
    void getLessonStepsByLessonIdEmptyList() {
        when(stepRepository.findByLessonIdOrderByPositionAsc(1L)).thenReturn(Arrays.asList());

        List<StepResponseDTO> result = stepService.getLessonStepsByLessonId(1L);

        assertThat(result).isEmpty();
        verify(stepRepository).findByLessonIdOrderByPositionAsc(1L);
    }

    @Test
    void updateStepSuccessful() {
        UpdateStepDTO updateDTO = new UpdateStepDTO();
        updateDTO.setStepId(1L);
        updateDTO.setType(StepType.VIDEO);
        updateDTO.setContent("Updated Content");

        when(stepRepository.findById(1L)).thenReturn(Optional.of(testStep));
        when(stepRepository.save(any(Step.class))).thenReturn(testStep);

        StepResponseDTO result = stepService.updateStep(updateDTO);

        assertThat(result.getType()).isEqualTo(StepType.VIDEO);
        assertThat(result.getContent()).isEqualTo("Updated Content");

        verify(stepRepository).findById(1L);
        verify(stepRepository).save(any(Step.class));
    }

    @Test
    void updateStepOnlyType() {
        UpdateStepDTO updateDTO = new UpdateStepDTO();
        updateDTO.setStepId(1L);
        updateDTO.setType(StepType.VIDEO);

        when(stepRepository.findById(1L)).thenReturn(Optional.of(testStep));
        when(stepRepository.save(any(Step.class))).thenReturn(testStep);

        StepResponseDTO result = stepService.updateStep(updateDTO);

        assertThat(result.getType()).isEqualTo(StepType.VIDEO);
        assertThat(result.getContent()).isEqualTo("Test Content");

        verify(stepRepository).findById(1L);
        verify(stepRepository).save(any(Step.class));
    }

    @Test
    void updateStepOnlyContent() {
        UpdateStepDTO updateDTO = new UpdateStepDTO();
        updateDTO.setStepId(1L);
        updateDTO.setContent("Updated Content");

        when(stepRepository.findById(1L)).thenReturn(Optional.of(testStep));
        when(stepRepository.save(any(Step.class))).thenReturn(testStep);

        StepResponseDTO result = stepService.updateStep(updateDTO);

        assertThat(result.getType()).isEqualTo(StepType.TEXT);
        assertThat(result.getContent()).isEqualTo("Updated Content");

        verify(stepRepository).findById(1L);
        verify(stepRepository).save(any(Step.class));
    }

    @Test
    void updateStepWithPositionChangeForward() {
        UpdateStepDTO updateDTO = new UpdateStepDTO();
        updateDTO.setStepId(1L);
        updateDTO.setPosition(3);

        when(stepRepository.findById(1L)).thenReturn(Optional.of(testStep));
        when(stepRepository.save(any(Step.class))).thenReturn(testStep);

        StepResponseDTO result = stepService.updateStep(updateDTO);

        assertThat(result.getPosition()).isEqualTo(3);
        verify(stepRepository).decrementPositionsFromTo(1L, 2, 3);
    }

    @Test
    void updateStepWithPositionChangeBackward() {
        Step stepAtPosition3 = createTestStep(1L, 3);
        UpdateStepDTO updateDTO = new UpdateStepDTO();
        updateDTO.setStepId(1L);
        updateDTO.setPosition(1);

        when(stepRepository.findById(1L)).thenReturn(Optional.of(stepAtPosition3));
        when(stepRepository.save(any(Step.class))).thenReturn(stepAtPosition3);

        StepResponseDTO result = stepService.updateStep(updateDTO);

        assertThat(result.getPosition()).isEqualTo(1);
        verify(stepRepository).incrementPositionsFromTo(1L, 1, 2);
    }

    @Test
    void updateStepNotFound() {
        UpdateStepDTO updateDTO = new UpdateStepDTO();
        updateDTO.setStepId(999L);
        updateDTO.setType(StepType.VIDEO);

        when(stepRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stepService.updateStep(updateDTO))
                .isInstanceOf(StepNotFoundException.class)
                .hasMessage("Step not found");

        verify(stepRepository).findById(999L);
        verify(stepRepository, never()).save(any(Step.class));
    }

    @Test
    void deleteStepSuccessful() {
        when(stepRepository.findById(1L)).thenReturn(Optional.of(testStep));

        stepService.deleteStep(1L);

        verify(stepRepository).findById(1L);
        verify(stepRepository).delete(testStep);
        verify(stepRepository).decrementPositionsFrom(1L, 2);
    }

    @Test
    void deleteStepNotFound() {
        when(stepRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stepService.deleteStep(999L))
                .isInstanceOf(StepNotFoundException.class)
                .hasMessage("Step not found");

        verify(stepRepository).findById(999L);
        verify(stepRepository, never()).delete(any(Step.class));
    }
}
