package org.core.service.agent.analyzer;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.CourseAuditPdfExportRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class CourseAuditPdfService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final Pattern BOLD_PATTERN = Pattern.compile("\\*\\*(.+?)\\*\\*");

    @Value("${app.brand.name}")
    private String brandName;

    @Value("${app.brand.site}")
    private String brandSite;

    public byte[] generate(CourseAuditPdfExportRequest request) throws IOException {
        if (!request.isIncludeReport() && !request.isIncludeImprovements() && !request.isIncludeNewContent()) {
            throw new IllegalArgumentException("Выберите хотя бы один раздел для экспорта");
        }

        BaseFont baseFont = loadBaseFont();
        Font titleFont = new Font(baseFont, 20, Font.BOLD, new Color(30, 30, 40));
        Font subtitleFont = new Font(baseFont, 11, Font.NORMAL, new Color(90, 90, 110));
        Font h1Font = new Font(baseFont, 16, Font.BOLD, new Color(30, 30, 40));
        Font h2Font = new Font(baseFont, 13, Font.BOLD, new Color(45, 45, 60));
        Font h3Font = new Font(baseFont, 11, Font.BOLD, new Color(55, 55, 75));
        Font bodyFont = new Font(baseFont, 10, Font.NORMAL, new Color(35, 35, 45));
        Font metaFont = new Font(baseFont, 9, Font.NORMAL, new Color(110, 110, 130));

        Document document = new Document(PageSize.A4, 48, 48, 56, 48);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, output);
        document.open();

        addHeader(document, request, titleFont, subtitleFont, metaFont, baseFont);

        if (request.isIncludeReport()) {
            addSection(document, "Краткий итог по курсу", request.getSummary(), h1Font, h2Font, h3Font, bodyFont);
            addSection(document, "План внедрения", request.getPlan(), h1Font, h2Font, h3Font, bodyFont);
        }
        if (request.isIncludeImprovements()) {
            addSection(document, "Доработка существующих уроков", request.getImprovements(), h1Font, h2Font, h3Font, bodyFont);
        }
        if (request.isIncludeNewContent()) {
            addSection(document, "Новые модули и уроки", request.getNewContent(), h1Font, h2Font, h3Font, bodyFont);
        }

        addFooter(document, metaFont);
        document.close();
        return output.toByteArray();
    }

    public String buildFilename(String courseTitle) {
        String safeTitle = courseTitle == null ? "" : courseTitle.trim();
        safeTitle = safeTitle.replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}]+", "_");
        safeTitle = safeTitle.replaceAll("_+", "_");
        if (safeTitle.startsWith("_")) {
            safeTitle = safeTitle.substring(1);
        }
        if (safeTitle.endsWith("_")) {
            safeTitle = safeTitle.substring(0, safeTitle.length() - 1);
        }
        if (safeTitle.isBlank()) {
            safeTitle = "курс";
        }
        return "аудит_" + safeTitle + "_" + LocalDate.now().format(DATE_FORMAT) + ".pdf";
    }

    private void addHeader(
            Document document,
            CourseAuditPdfExportRequest request,
            Font titleFont,
            Font subtitleFont,
            Font metaFont,
            BaseFont baseFont
    ) {
        Font logoFont = new Font(baseFont, 22, Font.BOLD, Color.WHITE);

        PdfPTable headerTable = new PdfPTable(new float[]{1f, 4.5f});
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(16f);

        PdfPCell logoCell = new PdfPCell(new Phrase("E", logoFont));
        logoCell.setBackgroundColor(new Color(79, 70, 229));
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        logoCell.setFixedHeight(48f);
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setPadding(8f);
        headerTable.addCell(logoCell);

        PdfPCell textCell = new PdfPCell();
        textCell.setBorder(Rectangle.NO_BORDER);
        textCell.setPaddingLeft(12f);
        textCell.addElement(new Paragraph(brandName, titleFont));
        textCell.addElement(new Paragraph(brandSite, subtitleFont));
        textCell.addElement(Chunk.NEWLINE);
        textCell.addElement(new Paragraph("Отчёт аудита курса", new Font(baseFont, 14, Font.BOLD, new Color(79, 70, 229))));
        String courseTitle = request.getCourseTitle() == null ? "—" : request.getCourseTitle().trim();
        textCell.addElement(new Paragraph("Курс: " + courseTitle, subtitleFont));
        textCell.addElement(new Paragraph("Дата: " + LocalDate.now().format(DATE_FORMAT), metaFont));
        headerTable.addCell(textCell);

        document.add(headerTable);
        document.add(new Paragraph(" ", metaFont));
    }

    private void addSection(
            Document document,
            String sectionTitle,
            String markdown,
            Font h1Font,
            Font h2Font,
            Font h3Font,
            Font bodyFont
    ) {
        if (markdown == null || markdown.isBlank()) {
            return;
        }

        Paragraph sectionHeading = new Paragraph(sectionTitle, h1Font);
        sectionHeading.setSpacingBefore(10f);
        sectionHeading.setSpacingAfter(8f);
        document.add(sectionHeading);

        for (Paragraph paragraph : markdownToParagraphs(markdown, h2Font, h3Font, bodyFont)) {
            document.add(paragraph);
        }
    }

    private List<Paragraph> markdownToParagraphs(String markdown, Font h2Font, Font h3Font, Font bodyFont) {
        List<Paragraph> paragraphs = new ArrayList<>();
        for (String rawLine : markdown.split("\n")) {
            String line = rawLine.trim();
            if (line.isEmpty()) {
                paragraphs.add(spacedParagraph(" ", bodyFont, 4f));
                continue;
            }

            if (line.startsWith("#### ")) {
                paragraphs.add(spacedParagraph(stripMarkdown(line.substring(5)), h3Font, 6f));
                continue;
            }
            if (line.startsWith("### ")) {
                paragraphs.add(spacedParagraph(stripMarkdown(line.substring(4)), h3Font, 8f));
                continue;
            }
            if (line.startsWith("## ")) {
                paragraphs.add(spacedParagraph(stripMarkdown(line.substring(3)), h2Font, 10f));
                continue;
            }

            if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
                Paragraph bullet = new Paragraph(12f);
                bullet.setIndentationLeft(14f);
                bullet.add(new Chunk("• ", bodyFont));
                bullet.add(buildInlinePhrase(line.substring(2).trim(), bodyFont));
                bullet.setSpacingAfter(3f);
                paragraphs.add(bullet);
                continue;
            }

            paragraphs.add(spacedPhraseParagraph(line, bodyFont, 4f));
        }
        return paragraphs;
    }

    private Paragraph spacedParagraph(String text, Font font, float spacingAfter) {
        Paragraph paragraph = new Paragraph(text, font);
        paragraph.setSpacingAfter(spacingAfter);
        return paragraph;
    }

    private Paragraph spacedPhraseParagraph(String text, Font font, float spacingAfter) {
        Paragraph paragraph = new Paragraph(buildInlinePhrase(text, font));
        paragraph.setSpacingAfter(spacingAfter);
        return paragraph;
    }

    private Phrase buildInlinePhrase(String text, Font baseFont) {
        Phrase phrase = new Phrase();
        Font boldFont = new Font(baseFont.getBaseFont(), baseFont.getSize(), Font.BOLD, baseFont.getColor());
        Matcher matcher = BOLD_PATTERN.matcher(text);
        int last = 0;
        while (matcher.find()) {
            if (matcher.start() > last) {
                phrase.add(new Chunk(stripMarkdown(text.substring(last, matcher.start())), baseFont));
            }
            phrase.add(new Chunk(matcher.group(1), boldFont));
            last = matcher.end();
        }
        if (last < text.length()) {
            phrase.add(new Chunk(stripMarkdown(text.substring(last)), baseFont));
        }
        if (phrase.isEmpty()) {
            phrase.add(new Chunk(stripMarkdown(text), baseFont));
        }
        return phrase;
    }

    private String stripMarkdown(String text) {
        return text
                .replaceAll("\\*\\*(.+?)\\*\\*", "$1")
                .replaceAll("`([^`]+)`", "$1")
                .trim();
    }

    private void addFooter(Document document, Font metaFont) {
        Paragraph footer = new Paragraph(
                "Сформировано в " + brandName + " · " + brandSite,
                metaFont
        );
        footer.setSpacingBefore(18f);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
    }

    private BaseFont loadBaseFont() throws IOException {
        ClassPathResource fontResource = new ClassPathResource("fonts/DejaVuSans.ttf");
        if (!fontResource.exists()) {
            throw new IOException("Font resource fonts/DejaVuSans.ttf not found");
        }
        try (InputStream inputStream = fontResource.getInputStream()) {
            byte[] fontBytes = inputStream.readAllBytes();
            if (fontBytes.length < 4 || fontBytes[0] != 0x00 || fontBytes[1] != 0x01 || fontBytes[2] != 0x00 || fontBytes[3] != 0x00) {
                throw new IOException("Font resource fonts/DejaVuSans.ttf is not a valid TTF file");
            }
            return BaseFont.createFont(
                    "DejaVuSans.ttf",
                    BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED,
                    true,
                    fontBytes,
                    null
            );
        }
    }
}
