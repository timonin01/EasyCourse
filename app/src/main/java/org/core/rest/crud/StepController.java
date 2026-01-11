package org.core.rest.crud;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.context.UserContextBean;
import org.core.domain.StepType;
import org.core.dto.step.CreateStepDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.step.UpdateStepDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.service.crud.StepService;
import org.core.service.stepik.step.StepTypeChangeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/steps")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepController {

    private final StepService stepService;
    private final StepTypeChangeService stepTypeChangeService;
    private final UserContextBean userContextBean;

    @GetMapping("/{stepId}")
    public StepResponseDTO getStepById(@PathVariable Long stepId) {
        return stepService.getStepById(stepId);
    }

    @GetMapping("/all_steps/{lessonId}")
    public List<StepResponseDTO> getLessonStepsByLessonId(@PathVariable Long lessonId) {
        return stepService.getLessonStepsByLessonId(lessonId);
    }

    @PostMapping
    public StepResponseDTO createStep(@RequestBody CreateStepDTO createStepDTO) {
        return stepService.createStep(createStepDTO);
    }

    @PutMapping("/update")
    public StepResponseDTO updateStep(@RequestBody UpdateStepDTO updateDto) {
        return stepService.updateStep(updateDto);
    }

    @PutMapping("/change-stepType")
    public StepResponseDTO changeStepType(
            @RequestParam Long stepId,
            @RequestParam StepType newStepType,
            @RequestHeader("User-Id") Long userId,
            @RequestParam String sessionId
    ){
        userContextBean.setUserId(userId);
        try {
            return stepTypeChangeService.changeStepType(stepId, newStepType, sessionId);
        } finally {
            userContextBean.clear();
        }
    }

    @DeleteMapping("/delete/{stepId}")
    public void deleteStep(@PathVariable Long stepId) {
        stepService.deleteStep(stepId);
    }
}
