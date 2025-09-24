package com.organicnow.backend.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.organicnow.backend.model.Contract;
import com.organicnow.backend.model.Tenant;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class TenantContractPdfService {

    public byte[] generateContractPdf(Tenant tenant, Contract contract) {
        System.out.println(">>> [TenantContractPdfService] Start generating PDF (bilingual version)");

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 50, 50, 60, 50);
            PdfWriter.getInstance(document, baos);
            document.open();

            // ================= Font =================
            BaseFont bf = BaseFont.createFont("fonts/THSarabunNew.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            Font titleFont = new Font(bf, 16, Font.BOLD);
            Font sectionFont = new Font(bf, 13, Font.BOLD);
            Font labelFont = new Font(bf, 11, Font.BOLD);
            Font valueFont = new Font(bf, 11);

            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            NumberFormat numberFmt = NumberFormat.getNumberInstance(Locale.US);
            numberFmt.setMinimumFractionDigits(2);

            // ================= Title =================
            Paragraph title = new Paragraph("RENTAL CONTRACT AGREEMENT\nหนังสือสัญญาเช่า", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // ================= Tenant Info =================
            Paragraph tenantHeader = new Paragraph("Tenant Information / ข้อมูลผู้เช่า", sectionFont);
            tenantHeader.setSpacingAfter(10);
            document.add(tenantHeader);

            PdfPTable tenantTable = new PdfPTable(2);
            tenantTable.setWidthPercentage(100);
            tenantTable.setSpacingAfter(15);
            tenantTable.addCell(makeCell("Name / ชื่อ", labelFont));
            tenantTable.addCell(makeCell(tenant.getFirstName() + " " + tenant.getLastName(), valueFont));
            tenantTable.addCell(makeCell("National ID / เลขบัตรประชาชน", labelFont));
            tenantTable.addCell(makeCell(tenant.getNationalId(), valueFont));
            tenantTable.addCell(makeCell("Phone / โทรศัพท์", labelFont));
            tenantTable.addCell(makeCell(tenant.getPhoneNumber(), valueFont));
            tenantTable.addCell(makeCell("Email / อีเมล", labelFont));
            tenantTable.addCell(makeCell(tenant.getEmail(), valueFont));
            document.add(tenantTable);

            // ================= Contract Info =================
            Paragraph contractHeader = new Paragraph("Contract Information / ข้อมูลสัญญา", sectionFont);
            contractHeader.setSpacingAfter(10);
            document.add(contractHeader);

            PdfPTable contractTable = new PdfPTable(2);
            contractTable.setWidthPercentage(100);
            contractTable.setSpacingAfter(15);
            contractTable.addCell(makeCell("Room / ห้อง", labelFont));
            contractTable.addCell(makeCell(contract.getRoom().getRoomNumber(), valueFont));
            contractTable.addCell(makeCell("Package / แพ็กเกจ", labelFont));
            contractTable.addCell(makeCell(contract.getPackagePlan().getContractType().getName(), valueFont));
            contractTable.addCell(makeCell("Price / ราคา", labelFont));
            contractTable.addCell(makeCell(numberFmt.format(contract.getPackagePlan().getPrice()) + " Baht", valueFont));
            contractTable.addCell(makeCell("Start Date / วันที่เริ่ม", labelFont));
            contractTable.addCell(makeCell(contract.getStartDate().format(dateFmt), valueFont));
            contractTable.addCell(makeCell("End Date / วันที่สิ้นสุด", labelFont));
            contractTable.addCell(makeCell(contract.getEndDate().format(dateFmt), valueFont));
            contractTable.addCell(makeCell("Deposit / เงินมัดจำ", labelFont));
            contractTable.addCell(makeCell(numberFmt.format(contract.getDeposit()) + " Baht", valueFont));
            contractTable.addCell(makeCell("Rent Amount / ค่าเช่า", labelFont));
            contractTable.addCell(makeCell(numberFmt.format(contract.getRentAmountSnapshot()) + " Baht", valueFont));
            document.add(contractTable);

            // ================= Terms =================
            Paragraph termsHeader = new Paragraph("Terms & Conditions / ข้อกำหนดและเงื่อนไข", sectionFont);
            termsHeader.setSpacingAfter(10);
            document.add(termsHeader);

            Paragraph terms = new Paragraph(
                    "1. The tenant agrees to pay rent on time.\n   ผู้เช่าตกลงที่จะชำระค่าเช่าตรงเวลา\n\n" +
                            "2. The landlord agrees to maintain the property.\n   เจ้าของบ้านตกลงที่จะดูแลรักษาทรัพย์สิน\n\n" +
                            "3. This contract is valid until the end date stated above.\n   สัญญานี้มีผลบังคับใช้จนถึงวันที่สิ้นสุดตามที่ระบุข้างต้น\n",
                    valueFont
            );
            terms.setSpacingAfter(30);
            document.add(terms);

            // ================= Signatures =================
            Paragraph signatureHeader = new Paragraph("Signatures / ลายเซ็น", sectionFont);
            signatureHeader.setSpacingAfter(20);
            document.add(signatureHeader);

            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);
            signTable.setSpacingBefore(30);

            signTable.addCell(makeSignatureCell("Landlord: ____________________\nเจ้าของบ้าน", valueFont));
            signTable.addCell(makeSignatureCell("Tenant: ____________________\nผู้เช่า", valueFont));
            signTable.addCell(makeSignatureCell("Date: ____________", valueFont));
            signTable.addCell(makeSignatureCell("Date: ____________", valueFont));

            document.add(signTable);

            document.close();
            System.out.println(">>> [TenantContractPdfService] PDF generated successfully ✅");
            return baos.toByteArray();
        } catch (Exception e) {
            System.err.println(">>> [TenantContractPdfService] ERROR: " + e.getMessage());
            throw new RuntimeException("Error generating PDF", e);
        }
    }

    // Helper method: create normal cell
    private PdfPCell makeCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(5);
        return cell;
    }

    // Helper method: create signature cell
    private PdfPCell makeSignatureCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(20);
        return cell;
    }
}