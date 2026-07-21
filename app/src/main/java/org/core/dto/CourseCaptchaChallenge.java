package org.core.dto;

import lombok.*;
import org.core.dto.stepik.StepikSyncFailure;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CourseCaptchaChallenge {

    private String sessionToken;
    private String captchaImageUrl;
    private String captchaKey;
    private String siteKey;
    private Long courseId;
    private String message;
    private List<StepikSyncFailure> failures = new ArrayList<>();
    
    public static CourseCaptchaChallenge noCaptchaNeeded(Long courseId) {
        return new CourseCaptchaChallenge(
                null, null, null, null, courseId,
                "Course created successfully without captcha",
                new ArrayList<>());
    }
    
    public static CourseCaptchaChallenge requiresCaptcha(Long courseId, String siteKey) {
        CourseCaptchaChallenge challenge = new CourseCaptchaChallenge();
        challenge.setCourseId(courseId);
        challenge.setSiteKey(siteKey);
        challenge.setMessage("Captcha required. Use the provided site key to show reCAPTCHA on frontend.");
        return challenge;
    }
}
