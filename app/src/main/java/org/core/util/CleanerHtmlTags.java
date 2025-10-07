package org.core.util;

import org.springframework.stereotype.Component;

@Component
public class CleanerHtmlTags {

    public String cleanHtmlTags(String htmlText) {
        if (htmlText == null || htmlText.trim().isEmpty()) {
            return htmlText;
        }
        String cleanText = htmlText.replaceAll("<[^>]+>", "");
        cleanText = cleanText.replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&nbsp;", " ");

        cleanText = cleanText.replaceAll("\\s+", " ").trim();
        return cleanText;
    }

}
