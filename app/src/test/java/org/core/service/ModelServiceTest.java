package org.core.service;

import org.core.domain.Course;
import org.core.domain.Model;
import org.core.domain.User;
import org.core.dto.model.CreateModelDTO;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.model.UpdateModelDTO;
import org.core.exception.exceptions.CourseNotFoundException;
import org.core.exception.exceptions.ModelNotFoundException;
import org.core.repository.CourseRepository;
import org.core.repository.ModelRepository;
import org.core.service.crud.ModelService;
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
public class ModelServiceTest {

    @Mock private ModelRepository modelRepository;
    @Mock private CourseRepository courseRepository;
    @InjectMocks private ModelService modelService;

    private Course testCourse;
    private Model testModel;
    private User testUser;

    @BeforeEach
    public void setUp() {
        testUser = createTestUser();
        testCourse = createTestCourse();
        testModel = createTestModel();
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
        return createTestModel(1L, 1);
    }

    private Model createTestModel(Long id, Integer position) {
        return Model.builder()
                .id(id)
                .title("Test Model")
                .description("Test Description")
                .course(testCourse)
                .position(position)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createModelCorrect() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(testCourse));
        when(modelRepository.save(any(Model.class))).thenReturn(testModel);

        CreateModelDTO createModelDTO = new CreateModelDTO(1L, "Test Model", "Test Description", 1);
        ModelResponseDTO result = modelService.createModule(createModelDTO);

        assertThat(result.getTitle()).isEqualTo("Test Model");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getCourseId()).isEqualTo(1L);
        assertThat(result.getPosition()).isEqualTo(1);

        verify(courseRepository).findById(1L);
        verify(modelRepository).save(any(Model.class));
        verify(modelRepository).incrementPositionsFromPosition(1L, 1);
    }

    @Test
    void createModelWithNullPosition() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(testCourse));

        Model modelWithAutoPosition = Model.builder()
                .id(1L)
                .title("Test Model")
                .description("Test Description")
                .course(testCourse)
                .position(3)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        when(modelRepository.save(any(Model.class))).thenReturn(modelWithAutoPosition);
        when(modelRepository.findMaxPositionByCourseId(1L)).thenReturn(Optional.of(2));

        CreateModelDTO createModelDTO = new CreateModelDTO(1L, "Test Model", "Test Description", null);
        ModelResponseDTO result = modelService.createModule(createModelDTO);

        assertThat(result.getPosition()).isEqualTo(3);
        verify(modelRepository).findMaxPositionByCourseId(1L);
        verify(modelRepository, never()).incrementPositionsFromPosition(any(), any());
    }

    @Test
    void createModelCourseNotExists() {
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        CreateModelDTO createModelDTO = new CreateModelDTO(999L, "Test Model", "Test Description", 1);

        assertThatThrownBy(() -> modelService.createModule(createModelDTO))
                .isInstanceOf(CourseNotFoundException.class)
                .hasMessage("Course not found");

        verify(courseRepository).findById(999L);
        verify(modelRepository, never()).save(any(Model.class));
    }

    @Test
    void getModelByModelIdSuccessful() {
        when(modelRepository.findById(1L)).thenReturn(Optional.of(testModel));

        ModelResponseDTO result = modelService.getModelBuModelId(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Test Model");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getCourseId()).isEqualTo(1L);

        verify(modelRepository).findById(1L);
    }

    @Test
    void getModelByModelIdNotFound() {
        when(modelRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> modelService.getModelBuModelId(999L))
                .isInstanceOf(ModelNotFoundException.class)
                .hasMessage("Model Not found");

        verify(modelRepository).findById(999L);
    }

    @Test
    void getCourseModelsByCourseIdSuccessful() {
        List<Model> models = Arrays.asList(testModel);
        when(modelRepository.findByCourseIdOrderByPositionAsc(1L)).thenReturn(models);

        List<ModelResponseDTO> result = modelService.getCourseModelsByCourseId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Test Model");
        assertThat(result.get(0).getCourseId()).isEqualTo(1L);

        verify(modelRepository).findByCourseIdOrderByPositionAsc(1L);
    }

    @Test
    void getCourseModelsByCourseIdEmptyList() {
        when(modelRepository.findByCourseIdOrderByPositionAsc(1L)).thenReturn(Arrays.asList());

        List<ModelResponseDTO> result = modelService.getCourseModelsByCourseId(1L);

        assertThat(result).isEmpty();
        verify(modelRepository).findByCourseIdOrderByPositionAsc(1L);
    }

    @Test
    void updateModelSuccessful() {
        UpdateModelDTO updateDTO = new UpdateModelDTO();
        updateDTO.setModelId(1L);
        updateDTO.setTitle("Updated Title");
        updateDTO.setDescription("Updated Description");

        when(modelRepository.findById(1L)).thenReturn(Optional.of(testModel));
        when(modelRepository.save(any(Model.class))).thenReturn(testModel);

        ModelResponseDTO result = modelService.updateModel(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getDescription()).isEqualTo("Updated Description");

        verify(modelRepository).findById(1L);
        verify(modelRepository).save(any(Model.class));
    }

    @Test
    void updateModelOnlyTitle() {
        UpdateModelDTO updateDTO = new UpdateModelDTO();
        updateDTO.setModelId(1L);
        updateDTO.setTitle("Updated Title");

        when(modelRepository.findById(1L)).thenReturn(Optional.of(testModel));
        when(modelRepository.save(any(Model.class))).thenReturn(testModel);

        ModelResponseDTO result = modelService.updateModel(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getDescription()).isEqualTo("Test Description");

        verify(modelRepository).findById(1L);
        verify(modelRepository).save(any(Model.class));
    }

    @Test
    void updateModelOnlyDescription() {
        UpdateModelDTO updateDTO = new UpdateModelDTO();
        updateDTO.setModelId(1L);
        updateDTO.setDescription("Updated Description");

        when(modelRepository.findById(1L)).thenReturn(Optional.of(testModel));
        when(modelRepository.save(any(Model.class))).thenReturn(testModel);

        ModelResponseDTO result = modelService.updateModel(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Test Model");
        assertThat(result.getDescription()).isEqualTo("Updated Description");

        verify(modelRepository).findById(1L);
        verify(modelRepository).save(any(Model.class));
    }

    @Test
    void updateModelOnlyPosition() {
        UpdateModelDTO updateDTO = new UpdateModelDTO();
        updateDTO.setModelId(1L);
        updateDTO.setPosition(3);

        when(modelRepository.findById(1L)).thenReturn(Optional.of(testModel));
        when(modelRepository.save(any(Model.class))).thenReturn(testModel);

        ModelResponseDTO result = modelService.updateModel(updateDTO);

        assertThat(result.getPosition()).isEqualTo(3);
        verify(modelRepository).decrementPositionsRange(1L, 2, 3);
    }

    @Test
    void updateModelNotFound() {
        UpdateModelDTO updateDTO = new UpdateModelDTO();
        updateDTO.setModelId(999L);
        updateDTO.setTitle("Updated Title");

        when(modelRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> modelService.updateModel(updateDTO))
                .isInstanceOf(ModelNotFoundException.class)
                .hasMessage("Model Not found");

        verify(modelRepository).findById(999L);
        verify(modelRepository, never()).save(any(Model.class));
    }

    @Test
    void deleteModelSuccessful() {
        when(modelRepository.findById(1L)).thenReturn(Optional.of(testModel));

        modelService.deleteModel(1L);

        verify(modelRepository).findById(1L);
        verify(modelRepository).delete(testModel);
        verify(modelRepository).decrementPositionsFromPosition(1L, 1);
    }

    @Test
    void deleteModelNotFound() {
        when(modelRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> modelService.deleteModel(999L))
                .isInstanceOf(ModelNotFoundException.class)
                .hasMessage("Model Not found");

        verify(modelRepository).findById(999L);
        verify(modelRepository, never()).delete(any(Model.class));
    }
}
