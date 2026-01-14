package org.core.service;

import org.core.domain.Course;
import org.core.domain.Section;
import org.core.domain.User;
import org.core.dto.section.CreateSectionDTO;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.section.UpdateSectionDTO;
import org.core.exception.exceptions.CourseNotFoundException;
import org.core.exception.exceptions.ModelNotFoundException;
import org.core.repository.CourseRepository;
import org.core.repository.SectionRepository;
import org.core.service.crud.SectionService;
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
public class SectionServiceTest {

    @Mock private SectionRepository sectionRepository;
    @Mock private CourseRepository courseRepository;
    @InjectMocks private SectionService sectionService;

    private Course testCourse;
    private Section testSection;
    private User testUser;

    @BeforeEach
    public void setUp() {
        testUser = createTestUser();
        testCourse = createTestCourse();
        testSection = createTestModel();
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
        return createTestModel(1L, 1);
    }

    private Section createTestModel(Long id, Integer position) {
        return Section.builder()
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
        when(sectionRepository.save(any(Section.class))).thenReturn(testSection);

        CreateSectionDTO createSectionDTO = new CreateSectionDTO(1L, "Test Model", "Test Description", 1);
        SectionResponseDTO result = sectionService.createSection(createSectionDTO);

        assertThat(result.getTitle()).isEqualTo("Test Model");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getCourseId()).isEqualTo(1L);
        assertThat(result.getPosition()).isEqualTo(1);

        verify(courseRepository).findById(1L);
        verify(sectionRepository).save(any(Section.class));
        verify(sectionRepository).incrementPositionsFromPosition(1L, 1);
    }

    @Test
    void createModelWithNullPosition() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(testCourse));

        Section sectionWithAutoPosition = Section.builder()
                .id(1L)
                .title("Test Model")
                .description("Test Description")
                .course(testCourse)
                .position(3)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        when(sectionRepository.save(any(Section.class))).thenReturn(sectionWithAutoPosition);
        when(sectionRepository.findMaxPositionByCourseId(1L)).thenReturn(Optional.of(2));

        CreateSectionDTO createSectionDTO = new CreateSectionDTO(1L, "Test Model", "Test Description", null);
        SectionResponseDTO result = sectionService.createSection(createSectionDTO);

        assertThat(result.getPosition()).isEqualTo(3);
        verify(sectionRepository).findMaxPositionByCourseId(1L);
        verify(sectionRepository, never()).incrementPositionsFromPosition(any(), any());
    }

    @Test
    void createModelCourseNotExists() {
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        CreateSectionDTO createSectionDTO = new CreateSectionDTO(999L, "Test Model", "Test Description", 1);

        assertThatThrownBy(() -> sectionService.createSection(createSectionDTO))
                .isInstanceOf(CourseNotFoundException.class)
                .hasMessage("Course not found");

        verify(courseRepository).findById(999L);
        verify(sectionRepository, never()).save(any(Section.class));
    }

    @Test
    void getModelByModelIdSuccessful() {
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(testSection));

        SectionResponseDTO result = sectionService.getSectionBySectionId(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Test Model");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getCourseId()).isEqualTo(1L);

        verify(sectionRepository).findById(1L);
    }

    @Test
    void getModelByModelIdNotFound() {
        when(sectionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sectionService.getSectionBySectionId(999L))
                .isInstanceOf(ModelNotFoundException.class)
                .hasMessage("Model Not found");

        verify(sectionRepository).findById(999L);
    }

    @Test
    void getCourseSectionsByCourseIdSuccessful() {
        List<Section> sections = Arrays.asList(testSection);
        when(sectionRepository.findByCourseIdOrderByPositionAsc(1L)).thenReturn(sections);

        List<SectionResponseDTO> result = sectionService.getCourseSectionsByCourseId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Test Model");
        assertThat(result.get(0).getCourseId()).isEqualTo(1L);

        verify(sectionRepository).findByCourseIdOrderByPositionAsc(1L);
    }

    @Test
    void getCourseSectionsByCourseIdEmptyList() {
        when(sectionRepository.findByCourseIdOrderByPositionAsc(1L)).thenReturn(Arrays.asList());

        List<SectionResponseDTO> result = sectionService.getCourseSectionsByCourseId(1L);

        assertThat(result).isEmpty();
        verify(sectionRepository).findByCourseIdOrderByPositionAsc(1L);
    }

    @Test
    void updateSectionSuccessful() {
        UpdateSectionDTO updateDTO = new UpdateSectionDTO();
        updateDTO.setModelId(1L);
        updateDTO.setTitle("Updated Title");
        updateDTO.setDescription("Updated Description");

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(testSection));
        when(sectionRepository.save(any(Section.class))).thenReturn(testSection);

        SectionResponseDTO result = sectionService.updateSection(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getDescription()).isEqualTo("Updated Description");

        verify(sectionRepository).findById(1L);
        verify(sectionRepository).save(any(Section.class));
    }

    @Test
    void updateSectionOnlyTitle() {
        UpdateSectionDTO updateDTO = new UpdateSectionDTO();
        updateDTO.setModelId(1L);
        updateDTO.setTitle("Updated Title");

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(testSection));
        when(sectionRepository.save(any(Section.class))).thenReturn(testSection);

        SectionResponseDTO result = sectionService.updateSection(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getDescription()).isEqualTo("Test Description");

        verify(sectionRepository).findById(1L);
        verify(sectionRepository).save(any(Section.class));
    }

    @Test
    void updateSectionOnlyDescription() {
        UpdateSectionDTO updateDTO = new UpdateSectionDTO();
        updateDTO.setModelId(1L);
        updateDTO.setDescription("Updated Description");

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(testSection));
        when(sectionRepository.save(any(Section.class))).thenReturn(testSection);

        SectionResponseDTO result = sectionService.updateSection(updateDTO);

        assertThat(result.getTitle()).isEqualTo("Test Model");
        assertThat(result.getDescription()).isEqualTo("Updated Description");

        verify(sectionRepository).findById(1L);
        verify(sectionRepository).save(any(Section.class));
    }

    @Test
    void updateSectionOnlyPosition() {
        UpdateSectionDTO updateDTO = new UpdateSectionDTO();
        updateDTO.setModelId(1L);
        updateDTO.setPosition(3);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(testSection));
        when(sectionRepository.save(any(Section.class))).thenReturn(testSection);

        SectionResponseDTO result = sectionService.updateSection(updateDTO);

        assertThat(result.getPosition()).isEqualTo(3);
        verify(sectionRepository).decrementPositionsRange(1L, 2, 3);
    }

    @Test
    void updateSectionNotFound() {
        UpdateSectionDTO updateDTO = new UpdateSectionDTO();
        updateDTO.setModelId(999L);
        updateDTO.setTitle("Updated Title");

        when(sectionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sectionService.updateSection(updateDTO))
                .isInstanceOf(ModelNotFoundException.class)
                .hasMessage("Model Not found");

        verify(sectionRepository).findById(999L);
        verify(sectionRepository, never()).save(any(Section.class));
    }

    @Test
    void deleteSectionSuccessful() {
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(testSection));

        sectionService.deleteSection(1L);

        verify(sectionRepository).findById(1L);
        verify(sectionRepository).delete(testSection);
        verify(sectionRepository).decrementPositionsFromPosition(1L, 1);
    }

    @Test
    void deleteSectionNotFound() {
        when(sectionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sectionService.deleteSection(999L))
                .isInstanceOf(ModelNotFoundException.class)
                .hasMessage("Model Not found");

        verify(sectionRepository).findById(999L);
        verify(sectionRepository, never()).delete(any(Section.class));
    }
}
