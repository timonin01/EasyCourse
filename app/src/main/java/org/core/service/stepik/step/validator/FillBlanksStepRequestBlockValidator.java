package org.core.service.stepik.step.validator;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.fillBlanks.request.StepikBlockFillBlanksRequest;
import org.core.dto.stepik.step.enterWord.fillBlanks.request.StepikFillBlanksComponentRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class FillBlanksStepRequestBlockValidator {

    public void validateAndFixFillBlanksBlock(StepikBlockRequest blockRequest, Long stepId) {
        if (!(blockRequest instanceof StepikBlockFillBlanksRequest fillBlanksRequest)) {
            return;
        }
        if (fillBlanksRequest.getSource() == null || fillBlanksRequest.getSource().getComponents() == null) {
            return;
        }
        List<StepikFillBlanksComponentRequest> inputList = fillBlanksRequest.getSource().getComponents();
        List<StepikFillBlanksComponentRequest> out = new ArrayList<>();

        for (int i = 0; i < inputList.size(); i++) {
            StepikFillBlanksComponentRequest c = inputList.get(i);
            if (c.getOptions() == null) {
                c.setOptions(new ArrayList<>());
            }

            String type = c.getType() != null ? c.getType().trim().toLowerCase() : "";
            boolean isBlankOrInput = "blank".equals(type) || "input".equals(type);
            if (type.isEmpty() || (!"text".equals(type) && !isBlankOrInput)) {
                type = !c.getOptions().isEmpty() ? "input" : "text";
            }
            if ("blank".equals(type)) {
                type = "input";
            }

            if ("text".equals(type)) {
                StepikFillBlanksComponentRequest textComp = new StepikFillBlanksComponentRequest();
                textComp.setType("text");
                textComp.setText(c.getText() == null || c.getText().trim().isEmpty() ? "" : c.getText().trim());
                textComp.setOptions(new ArrayList<>());
                out.add(textComp);
                continue;
            }

            if (c.getOptions().isEmpty()) {
                log.warn("Step {} fill-blanks component[{}] input with empty options. Adding as text.", stepId, i);
                StepikFillBlanksComponentRequest textComp = new StepikFillBlanksComponentRequest();
                textComp.setType("text");
                textComp.setText(c.getText() != null ? c.getText().trim() : "");
                textComp.setOptions(new ArrayList<>());
                out.add(textComp);
                continue;
            }

            String prefix = c.getText() != null && !c.getText().trim().isEmpty() ? c.getText().trim() : null;
            if (prefix != null) {
                StepikFillBlanksComponentRequest textComp = new StepikFillBlanksComponentRequest();
                textComp.setType("text");
                textComp.setText(prefix);
                textComp.setOptions(new ArrayList<>());
                out.add(textComp);
            }
            StepikFillBlanksComponentRequest inputComp = new StepikFillBlanksComponentRequest();
            inputComp.setType("input");
            inputComp.setText("");
            inputComp.setOptions(c.getOptions());
            out.add(inputComp);
        }

        fillBlanksRequest.getSource().setComponents(out);
    }

}
