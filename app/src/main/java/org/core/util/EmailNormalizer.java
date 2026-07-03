package org.core.util;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class EmailNormalizer {

    public String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

}