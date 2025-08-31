package org.core.rest;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.lesson.CreateLessonDTO;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.lesson.UpdateLessonDTO;
import org.core.service.LessonService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class LessonController {

    private final LessonService lessonService;

    @GetMapping("/{lessonId}")
    public LessonResponseDTO getLessonByLessonID(@PathVariable Long lessonId) {
        return lessonService.getLessonByLessonID(lessonId);
    }

    @GetMapping("/all_lessons/{modelId}")
    public List<LessonResponseDTO> getModelLessonsByModelId(@PathVariable Long modelId) {
        return lessonService.getModelLessonsByModelId(modelId);
    }

    @PostMapping
    public LessonResponseDTO createLesson(@Valid @RequestBody CreateLessonDTO createDTO) {
        return lessonService.createLesson(createDTO);
    }

    @PutMapping("/update")
    public LessonResponseDTO updateLesson(@Valid @RequestBody UpdateLessonDTO updateDTO) {
        return lessonService.updateLesson(updateDTO);
    }

    @DeleteMapping("/delete/{lessonId}")
    public void deleteLesson(@PathVariable Long lessonId) {
        lessonService.deleteLesson(lessonId);
    }
}
