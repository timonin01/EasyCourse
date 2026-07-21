package org.core.dto;

import lombok.*;
import org.core.dto.stepik.StepikSyncFailure;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LessonCaptchaChallenge {

    private String sessionToken;
    private String captchaImageUrl;
    private String captchaKey;
    private String siteKey;
    private Long lessonId;
    private String message;
    private List<StepikSyncFailure> failures = new ArrayList<>();
    
    public static LessonCaptchaChallenge noCaptchaNeeded(Long lessonId) {
        return new LessonCaptchaChallenge(
                null, null, null, null, lessonId,
                "Lesson created successfully without captcha",
                new ArrayList<>());
    }
    
    public static LessonCaptchaChallenge requiresCaptcha(Long lessonId, String siteKey) {
        LessonCaptchaChallenge challenge = new LessonCaptchaChallenge();
        challenge.setLessonId(lessonId);
        challenge.setSiteKey(siteKey);
        challenge.setMessage("Captcha required. Use the provided site key to show reCAPTCHA on frontend.");
        return challenge;
    }
}
