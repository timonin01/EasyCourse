package org.core.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CaptchaChallenge {

    private String sessionToken;
    private String captchaImageUrl;
    private String captchaKey;
    private String siteKey;
    private Long courseId;
    private String message;
    
    public static CaptchaChallenge noCaptchaNeeded(Long courseId) {
        return new CaptchaChallenge(null, null, null, null, courseId, "Course created successfully without captcha");
    }
    
    public static CaptchaChallenge requiresCaptcha(Long courseId, String siteKey) {
        CaptchaChallenge challenge = new CaptchaChallenge();
        challenge.setCourseId(courseId);
        challenge.setSiteKey(siteKey);
        challenge.setMessage("Captcha required. Use the provided site key to show reCAPTCHA on frontend.");
        return challenge;
    }
}
