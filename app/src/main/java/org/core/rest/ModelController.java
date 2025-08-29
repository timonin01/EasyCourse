package org.core.rest;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.model.CreateModelDTO;
import org.core.dto.model.ModelResponseDTO;
import org.core.dto.model.UpdateModelDTO;
import org.core.service.ModelService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/models")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class ModelController {

    private final ModelService modelService;

    @GetMapping("/{modelId}")
    public ModelResponseDTO getModelBuModelId(@PathVariable Long modelId) {
        return modelService.getModelBuModelId(modelId);
    }

    @GetMapping("/{courseId}")
    public List<ModelResponseDTO> getCourseModelsByCourseId(@PathVariable Long courseId) {
        return modelService.getCourseModelsByCourseId(courseId);
    }

    @PostMapping
    public ModelResponseDTO createModule(@Valid @RequestBody CreateModelDTO createDTO) {
        return modelService.createModule(createDTO);
    }

    @PutMapping("/update")
    public ModelResponseDTO updateModel(@Valid @RequestBody UpdateModelDTO updateDTO) {
        return modelService.updateModel(updateDTO);
    }

    @DeleteMapping("/delete/{modelId}")
    public void deleteModel(@PathVariable Long modelId) {
        modelService.deleteModel(modelId);
    }
}
