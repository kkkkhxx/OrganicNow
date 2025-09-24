package com.organicnow.backend.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.organicnow.backend.dto.CreateTenantContractRequest;
import com.organicnow.backend.dto.TenantDto;
import com.organicnow.backend.dto.TenantDetailDto;
import com.organicnow.backend.dto.UpdateTenantContractRequest;
import com.organicnow.backend.model.*;
import com.organicnow.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.text.NumberFormat;
import java.util.Locale;

@Service
public class TenantContractService {

    private final TenantRepository tenantRepository;
    private final RoomRepository roomRepository;
    private final PackagePlanRepository packagePlanRepository;
    private final ContractRepository contractRepository;
    private final InvoiceRepository invoiceRepository;

    public TenantContractService(TenantRepository tenantRepository,
                                 RoomRepository roomRepository,
                                 PackagePlanRepository packagePlanRepository,
                                 ContractRepository contractRepository,
                                 InvoiceRepository invoiceRepository) {
        this.tenantRepository = tenantRepository;
        this.roomRepository = roomRepository;
        this.packagePlanRepository = packagePlanRepository;
        this.contractRepository = contractRepository;
        this.invoiceRepository = invoiceRepository;
    }

    // ➕ CREATE
    @Transactional
    public TenantDto create(CreateTenantContractRequest req) {
        // 1. หา tenant เดิม หรือสร้างใหม่
        Tenant tenant = tenantRepository.findByNationalId(req.getNationalId())
                .orElse(null);

        if (tenant != null) {
            // มี tenant อยู่แล้ว → เช็ค contract active
            boolean hasActive = contractRepository
                    .existsByTenant_IdAndStatusAndEndDateAfter(
                            tenant.getId(), 1, LocalDateTime.now());

            if (hasActive) {
                throw new RuntimeException("tenant_already_has_active_contract");
            }
        } else {
            // ไม่มี tenant → สร้างใหม่
            tenant = Tenant.builder()
                    .firstName(req.getFirstName())
                    .lastName(req.getLastName())
                    .email(req.getEmail())
                    .phoneNumber(req.getPhoneNumber())
                    .nationalId(req.getNationalId())
                    .build();
            tenant = tenantRepository.saveAndFlush(tenant);
        }

        // 2. สร้าง contract ใหม่
        Room room = roomRepository.findById(req.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found: " + req.getRoomId()));
        PackagePlan plan = packagePlanRepository.findById(req.getPackageId())
                .orElseThrow(() -> new RuntimeException("Package plan not found: " + req.getPackageId()));

        Contract contract = Contract.builder()
                .tenant(tenant)
                .room(room)
                .packagePlan(plan)
                .signDate(req.getSignDate() != null ? req.getSignDate() : LocalDateTime.now())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .status(1) // active
                .deposit(req.getDeposit())
                .rentAmountSnapshot(req.getRentAmountSnapshot())
                .build();

        contractRepository.save(contract);

        return TenantDto.builder()
                .contractId(contract.getId())
                .firstName(tenant.getFirstName())
                .lastName(tenant.getLastName())
                .email(tenant.getEmail())
                .floor(room.getRoomFloor())
                .room(room.getRoomNumber())
                .packageId(plan.getId())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .phoneNumber(tenant.getPhoneNumber())
                .build();
    }

    // ✏️ UPDATE
    @Transactional
    public TenantDto update(Long contractId, UpdateTenantContractRequest req) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found: " + contractId));

        Tenant tenant = contract.getTenant();
        if (req.getFirstName() != null) tenant.setFirstName(req.getFirstName());
        if (req.getLastName() != null) tenant.setLastName(req.getLastName());
        if (req.getEmail() != null) tenant.setEmail(req.getEmail());
        if (req.getPhoneNumber() != null) tenant.setPhoneNumber(req.getPhoneNumber());
        if (req.getNationalId() != null) tenant.setNationalId(req.getNationalId());
        tenantRepository.save(tenant);

        if (req.getRoomId() != null) {
            Room room = roomRepository.findById(req.getRoomId())
                    .orElseThrow(() -> new RuntimeException("Room not found: " + req.getRoomId()));
            contract.setRoom(room);
        }
        if (req.getPackageId() != null) {
            PackagePlan plan = packagePlanRepository.findById(req.getPackageId())
                    .orElseThrow(() -> new RuntimeException("Package plan not found: " + req.getPackageId()));
            contract.setPackagePlan(plan);
        }

        if (req.getSignDate() != null) contract.setSignDate(req.getSignDate());
        if (req.getStartDate() != null) contract.setStartDate(req.getStartDate());
        if (req.getEndDate() != null) contract.setEndDate(req.getEndDate());
        if (req.getStatus() != null) contract.setStatus(req.getStatus());
        if (req.getDeposit() != null) contract.setDeposit(req.getDeposit());
        if (req.getRentAmountSnapshot() != null) contract.setRentAmountSnapshot(req.getRentAmountSnapshot());

        Contract saved = contractRepository.save(contract);

        return TenantDto.builder()
                .contractId(saved.getId())
                .firstName(saved.getTenant().getFirstName())
                .lastName(saved.getTenant().getLastName())
                .email(saved.getTenant().getEmail())
                .floor(saved.getRoom().getRoomFloor())
                .room(saved.getRoom().getRoomNumber())
                .packageId(saved.getPackagePlan().getId())
                .startDate(saved.getStartDate())
                .endDate(saved.getEndDate())
                .phoneNumber(saved.getTenant().getPhoneNumber())
                .build();
    }

    // ❌ DELETE
    @Transactional
    public void delete(Long contractId) {
        if (!contractRepository.existsById(contractId)) {
            throw new RuntimeException("Contract not found: " + contractId);
        }
        contractRepository.deleteById(contractId);
    }

    // 🔍 DETAIL
    @Transactional(readOnly = true)
    public TenantDetailDto getDetail(Long contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found: " + contractId));

        Tenant tenant = contract.getTenant();
        Room room = contract.getRoom();
        PackagePlan plan = contract.getPackagePlan();

        List<Invoice> invoices = invoiceRepository.findByContact_IdOrderByIdDesc(contractId);

        List<TenantDetailDto.InvoiceDto> invoiceDtos = invoices.stream()
                .map(inv -> TenantDetailDto.InvoiceDto.builder()
                        .invoiceId(inv.getId())
                        .createDate(inv.getCreateDate())
                        .dueDate(inv.getDueDate())
                        .invoiceStatus(inv.getInvoiceStatus())
                        .netAmount(inv.getNetAmount())
                        .payDate(inv.getPayDate())
                        .payMethod(inv.getPayMethod())
                        .penaltyTotal(inv.getPenaltyTotal())
                        .subTotal(inv.getSubTotal())
                        .build()
                ).toList();

        return TenantDetailDto.builder()
                .contractId(contract.getId())
                .firstName(tenant.getFirstName())
                .lastName(tenant.getLastName())
                .email(tenant.getEmail())
                .phoneNumber(tenant.getPhoneNumber())
                .nationalId(tenant.getNationalId())
                .floor(room.getRoomFloor())
                .room(room.getRoomNumber())
                .packageName(plan.getContractType().getName())
                .packagePrice(plan.getPrice())
                .signDate(contract.getSignDate())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .status(contract.getStatus())
                .deposit(contract.getDeposit())
                .rentAmountSnapshot(contract.getRentAmountSnapshot())
                .invoices(invoiceDtos)
                .build();
    }

    // 📄 GENERATE CONTRACT PDF
    @Transactional(readOnly = true)
    public byte[] generateContractPdf(Long contractId) {
        System.out.println(">>> [TenantContractService] Generating PDF for contractId=" + contractId);

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found: " + contractId));

        Tenant tenant = contract.getTenant();
        Room room = contract.getRoom();
        PackagePlan plan = contract.getPackagePlan();

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 54, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            // ===== Fonts =====
            String regularFontPath = this.getClass().getClassLoader()
                    .getResource("fonts/Sarabun-Regular.ttf")
                    .getPath();
            BaseFont bfRegular = BaseFont.createFont(regularFontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);

            String boldFontPath = this.getClass().getClassLoader()
                    .getResource("fonts/Sarabun-Bold.ttf")
                    .getPath();
            BaseFont bfBold = BaseFont.createFont(boldFontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);

            Font normalFont = new Font(bfRegular, 12, Font.NORMAL);
            Font sectionFont = new Font(bfBold, 13, Font.BOLD);
            Font titleFont = new Font(bfBold, 16, Font.BOLD);

            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            NumberFormat numberFmt = NumberFormat.getNumberInstance(Locale.US);
            numberFmt.setMinimumFractionDigits(2);

            // ===== Title =====
            Paragraph title = new Paragraph("RENTAL CONTRACT AGREEMENT\nสัญญาเช่า", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // ===== Tenant Info =====
            Paragraph tenantHeader = new Paragraph("Tenant Information / ข้อมูลผู้เช่า", sectionFont);
            tenantHeader.setSpacingAfter(10);
            document.add(tenantHeader);

            PdfPTable tenantTable = new PdfPTable(2);
            tenantTable.setWidthPercentage(100);
            tenantTable.setSpacingAfter(15);
            tenantTable.addCell(makeCell("Name / ชื่อ", normalFont));
            tenantTable.addCell(makeCell(tenant.getFirstName() + " " + tenant.getLastName(), normalFont));
            tenantTable.addCell(makeCell("National ID / เลขบัตรประชาชน", normalFont));
            tenantTable.addCell(makeCell(tenant.getNationalId(), normalFont));
            tenantTable.addCell(makeCell("Phone / โทรศัพท์", normalFont));
            tenantTable.addCell(makeCell(tenant.getPhoneNumber(), normalFont));
            tenantTable.addCell(makeCell("Email / อีเมล", normalFont));
            tenantTable.addCell(makeCell(tenant.getEmail(), normalFont));
            document.add(tenantTable);

            // ===== Contract Info =====
            Paragraph contractHeader = new Paragraph("Contract Information / ข้อมูลสัญญา", sectionFont);
            contractHeader.setSpacingAfter(10);
            document.add(contractHeader);

            PdfPTable contractTable = new PdfPTable(2);
            contractTable.setWidthPercentage(100);
            contractTable.setSpacingAfter(15);
            contractTable.addCell(makeCell("Room / ห้อง", normalFont));
            contractTable.addCell(makeCell(room.getRoomNumber() + " (Floor " + room.getRoomFloor() + ")", normalFont));
            contractTable.addCell(makeCell("Package / แพ็กเกจ", normalFont));
            contractTable.addCell(makeCell(plan.getContractType().getName(), normalFont));
            contractTable.addCell(makeCell("Price / ราคา", normalFont));
            contractTable.addCell(makeCell(numberFmt.format(plan.getPrice()) + " Baht", normalFont));
            contractTable.addCell(makeCell("Start Date / วันที่เริ่ม", normalFont));
            contractTable.addCell(makeCell(contract.getStartDate().format(dateFmt), normalFont));
            contractTable.addCell(makeCell("End Date / วันที่สิ้นสุด", normalFont));
            contractTable.addCell(makeCell(contract.getEndDate().format(dateFmt), normalFont));
            contractTable.addCell(makeCell("Deposit / เงินมัดจำ", normalFont));
            contractTable.addCell(makeCell(numberFmt.format(contract.getDeposit()) + " Baht", normalFont));
            contractTable.addCell(makeCell("Rent Amount / ค่าเช่า", normalFont));
            contractTable.addCell(makeCell(numberFmt.format(contract.getRentAmountSnapshot()) + " Baht", normalFont));
            document.add(contractTable);

            // ===== Terms =====
            Paragraph termsHeader = new Paragraph("Terms & Conditions / ข้อกำหนดและเงื่อนไข", sectionFont);
            termsHeader.setSpacingAfter(10);
            document.add(termsHeader);

            Paragraph terms = new Paragraph(
                    "1. The tenant agrees to pay rent on time. / ผู้เช่าตกลงที่จะชำระค่าเช่าตรงเวลา\n\n" +
                            "2. The landlord agrees to maintain the property. / เจ้าของบ้านตกลงที่จะดูแลรักษาทรัพย์สิน\n\n" +
                            "3. This contract is valid until the end date stated above. / สัญญานี้มีผลบังคับใช้จนถึงวันที่สิ้นสุดตามที่ระบุข้างต้น\n\n",
                    normalFont
            );
            document.add(terms);

            // ===== Signatures =====
            Paragraph signatureHeader = new Paragraph("Signatures / ลายเซ็น", sectionFont);
            signatureHeader.setSpacingAfter(20);
            document.add(signatureHeader);

            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);
            signTable.setSpacingBefore(30);

            signTable.addCell(makeCell("Landlord / เจ้าของบ้าน: ____________________\n", normalFont));
            signTable.addCell(makeCell("Date: ____________", normalFont));
            signTable.addCell(makeCell("Tenant / ผู้เช่า: ____________________\n", normalFont));
            signTable.addCell(makeCell("Date: ____________", normalFont));
            document.add(signTable);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }

    // Helper method
    private PdfPCell makeCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(5);
        return cell;
    }
}