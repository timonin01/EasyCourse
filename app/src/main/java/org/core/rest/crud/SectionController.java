package org.core.rest.crud;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.section.CreateSectionDTO;
import org.core.dto.section.SectionResponseDTO;
import org.core.dto.section.UpdateSectionDTO;
import org.core.service.crud.SectionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sections")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class SectionController {

    private final SectionService sectionService;

    @GetMapping("/{sectionId}")
    public SectionResponseDTO getSectionBySectionId(@PathVariable Long sectionId) {
        return sectionService.getSectionBySectionId(sectionId);
    }

    @GetMapping("/all_sections/{courseId}")
    public List<SectionResponseDTO> getCourseSectionsByCourseId(@PathVariable Long courseId) {
        return sectionService.getCourseSectionsByCourseId(courseId);
    }

    @PostMapping
    public SectionResponseDTO createSection(@Valid @RequestBody CreateSectionDTO createDTO) {
        return sectionService.createSection(createDTO);
    }

    @PutMapping("/update")
    public SectionResponseDTO updateSection(@Valid @RequestBody UpdateSectionDTO updateDTO) {
        return sectionService.updateSection(updateDTO);
    }

    @DeleteMapping("/delete/{sectionId}")
    public void deleteSection(@PathVariable Long sectionId) {
        sectionService.deleteSection(sectionId);
    }
}
