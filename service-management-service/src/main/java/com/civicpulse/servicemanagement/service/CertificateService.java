package com.civicpulse.servicemanagement.service;

import com.civicpulse.servicemanagement.entity.ServiceApplication;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

@Service
public class CertificateService {
    private static final Logger log = LoggerFactory.getLogger(CertificateService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");

    private byte[] signatureFontBytes;

    public CertificateService() {
        try {
            ClassPathResource resource = new ClassPathResource("fonts/GreatVibes-Regular.ttf");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    signatureFontBytes = StreamUtils.copyToByteArray(is);
                }
            } else {
                log.warn("GreatVibes-Regular.ttf not found in classpath");
            }
        } catch (Exception e) {
            log.error("Failed to load signature font bytes", e);
        }
    }

    public byte[] generateCertificatePdf(ServiceApplication app, boolean isPreview) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);
            
            // ── Header ────────────────────────────────────────────────
            Paragraph header = new Paragraph("GOVERNMENT OF INDIA")
                .setFontSize(18)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(0, 51, 102));
            doc.add(header);
            
            doc.add(new Paragraph("CivicPulse Nexus — Municipal Services")
                .setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(ColorConstants.DARK_GRAY));
            
            doc.add(new Paragraph("─────────────────────────────────────────────")
                .setTextAlignment(TextAlignment.CENTER));
            
            // ── Certificate Type ──────────────────────────────────────
            doc.add(new Paragraph(app.getServiceType().name().replace("_", " ").toUpperCase())
                .setFontSize(22)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(180, 20, 20))
                .setMarginTop(10));
            
            doc.add(new Paragraph("Certificate Number: " + (app.getCertificateNumber() != null ? app.getCertificateNumber() : "PENDING"))
                .setFontSize(11)
                .setTextAlignment(TextAlignment.CENTER)
                .setBold());
            
            doc.add(new Paragraph(" "));
            
            // ── Certificate Body ──────────────────────────────────────
            doc.add(new Paragraph(
                "This is to certify that the following individual has been verified and " +
                (isPreview ? "will be approved" : "approved") + " for the issuance of " + app.getServiceType().name().replace("_", " ").toLowerCase() +
                " by the Municipal Authority under CivicPulse Nexus Governance Platform.")
                .setFontSize(11)
                .setTextAlignment(TextAlignment.JUSTIFIED));
            
            doc.add(new Paragraph(" "));
            
            // ── Details Table ─────────────────────────────────────────
            Table table = new Table(UnitValue.createPercentArray(new float[]{40, 60}))
                .useAllAvailableWidth();
            addRow(table, "Applicant Name",    app.getApplicantName());
            addRow(table, "Aadhaar Number",    maskAadhaar(app.getAadhaarNumber()));
            addRow(table, "Certificate Type",  app.getServiceType().name().replace("_", " "));
            addRow(table, "Certificate No.",   app.getCertificateNumber() != null ? app.getCertificateNumber() : "PENDING");
            addRow(table, "Application No.",   app.getApplicationNumber());
            addRow(table, "Applied Date",      app.getAppliedDate() != null ? app.getAppliedDate().format(FMT) : "N/A");
            if (!isPreview) {
                addRow(table, "Approved Date", app.getApprovedDate() != null ? app.getApprovedDate().format(FMT) : "N/A");
            }
            addRow(table, "Department",        app.getDepartment() != null ? app.getDepartment() : "Municipal Corporation");
            
            if (isPreview) {
                addRow(table, "Status", "PREVIEW");
            } else {
                addRow(table, "Status", app.getStatus().name());
            }
            doc.add(table);
            
            doc.add(new Paragraph(" "));
            
            // ── Digital Signature ─────────────────────────────────────
            doc.add(new Paragraph("─────────────────────────────────────────────")
                .setTextAlignment(TextAlignment.CENTER));
                
            if (isPreview) {
                doc.add(new Paragraph("DIGITAL SIGNATURE")
                    .setFontSize(13)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(new DeviceRgb(0, 100, 0)));
                doc.add(new Paragraph("PREVIEW CERTIFICATE\nNot valid for official use.")
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setItalic()
                    .setFontColor(ColorConstants.GRAY));
                    
                doc.showTextAligned(new Paragraph("PREVIEW")
                        .setFontSize(120)
                        .setFontColor(ColorConstants.LIGHT_GRAY),
                        297, 421, 1, TextAlignment.CENTER, VerticalAlignment.MIDDLE, (float) Math.PI / 4);
            } else {
                doc.add(new Paragraph("APPROVED AND DIGITALLY SIGNED")
                    .setFontSize(11)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(new DeviceRgb(0, 51, 102)));
        
                doc.add(new Paragraph("Approved By")
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.DARK_GRAY));
        
                try {
                    if (signatureFontBytes != null) {
                        com.itextpdf.kernel.font.PdfFont signatureFont = com.itextpdf.kernel.font.PdfFontFactory.createFont(
                            signatureFontBytes, com.itextpdf.io.font.PdfEncodings.IDENTITY_H, com.itextpdf.kernel.font.PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
                        doc.add(new Paragraph(app.getDigitallySignedBy() != null ? app.getDigitallySignedBy() : "Municipal Officer")
                            .setFont(signatureFont)
                            .setFontSize(24)
                            .setTextAlignment(TextAlignment.CENTER)
                            .setFontColor(new DeviceRgb(0, 0, 128)));
                    } else {
                        doc.add(new Paragraph(app.getDigitallySignedBy() != null ? app.getDigitallySignedBy() : "Municipal Officer")
                            .setFontSize(16)
                            .setItalic()
                            .setTextAlignment(TextAlignment.CENTER));
                    }
                } catch (Exception e) {
                    log.warn("Failed to load signature font", e);
                    doc.add(new Paragraph(app.getDigitallySignedBy() != null ? app.getDigitallySignedBy() : "Municipal Officer")
                        .setFontSize(14)
                        .setItalic()
                        .setTextAlignment(TextAlignment.CENTER));
                }
        
                doc.add(new Paragraph(app.getApprovedBy() != null ? app.getApprovedBy() : "Municipal Officer")
                    .setFontSize(10)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER));
        
                doc.add(new Paragraph(app.getDepartment() != null ? app.getDepartment() : "Municipal Corporation")
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER));
        
                doc.add(new Paragraph("Digitally Signed")
                    .setFontSize(9)
                    .setItalic()
                    .setTextAlignment(TextAlignment.CENTER));
        
                doc.add(new Paragraph("Approved Date: " + (app.getApprovedDate() != null ? app.getApprovedDate().format(FMT) : "N/A"))
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER));
        
                doc.add(new Paragraph("Certificate ID: " + app.getCertificateNumber())
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER));
                    
                if (app.getDigitalSignature() != null) {
                    doc.add(new Paragraph("Verification ID: " + app.getDigitalSignature())
                        .setFontSize(9)
                        .setTextAlignment(TextAlignment.CENTER));
                }
                
                doc.add(new Paragraph(" "));
                
                doc.add(new Paragraph("✔ Digitally Signed Certificate")
                    .setFontSize(10)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(new DeviceRgb(0, 128, 0)));
                doc.add(new Paragraph("This certificate has been electronically approved under the CivicPulse Nexus Governance Platform.\nNo physical signature or seal is required.")
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY));
            }
            
            doc.close();
            log.info("PDF generated for certificate: {} (Preview: {})", app.getCertificateNumber(), isPreview);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Certificate PDF generation failed", e);
        }
    }

    // Overloaded method for backward compatibility
    public byte[] generateCertificatePdf(ServiceApplication app) {
        return generateCertificatePdf(app, false);
    }

    private void addRow(Table table, String label, String value) {
        table.addCell(new Cell()
            .add(new Paragraph(label).setBold().setFontSize(10))
            .setBackgroundColor(new DeviceRgb(240, 248, 255)));
        table.addCell(new Cell()
            .add(new Paragraph(value != null ? value : "—").setFontSize(10)));
    }

    private String maskAadhaar(String aadhaar) {
        if (aadhaar == null || aadhaar.length() < 4) return "****";
        return "XXXX-XXXX-" + aadhaar.substring(aadhaar.length() - 4);
    }
}
