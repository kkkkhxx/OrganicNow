package com.organicnow.backend.service;

import com.organicnow.backend.dto.CreateInvoiceRequest;
import com.organicnow.backend.dto.InvoiceDto;
import com.organicnow.backend.dto.UpdateInvoiceRequest;
import com.organicnow.backend.model.Invoice;
import com.organicnow.backend.repository.ContractRepository;
import com.organicnow.backend.repository.InvoiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ContractRepository contractRepository;

    public InvoiceServiceImpl(InvoiceRepository invoiceRepository,
                              ContractRepository contractRepository) {
        this.invoiceRepository = invoiceRepository;
        this.contractRepository = contractRepository;
    }

    // ===== CRUD =====
    @Override
    public List<InvoiceDto> getAllInvoices() {
        List<Invoice> invoices = invoiceRepository.findAll();
        return invoices.stream().map(this::convertToDto).toList();
    }

    @Override
    public Optional<InvoiceDto> getInvoiceById(Long id) {
        return invoiceRepository.findById(id).map(this::convertToDto);
    }

    @Override
    public InvoiceDto createInvoice(CreateInvoiceRequest request) {
        // ----- 1) เตรียมอินพุต -----
        LocalDateTime createDate = parseCreateDateOrNow(request.getCreateDate());

        int penalty = nullSafeInt(request.getPenaltyTotal());
        int rent = nullSafeInt(request.getRentAmount());

        Integer uiElecUnit = request.getElecUnit(); // alias จาก UI
        int waterUnit = request.getWaterUnit() != null ? request.getWaterUnit() : 0;
        int waterRate = request.getWaterRate() != null ? request.getWaterRate() : 0;
        int electricityUnit = request.getElectricityUnit() != null ? request.getElectricityUnit()
                : (uiElecUnit != null ? uiElecUnit : 0);
        int electricityRate = request.getElectricityRate() != null ? request.getElectricityRate() : 0;

        Integer waterAmountFromUi = request.getWater();
        Integer elecAmountFromUi = request.getElectricity();
        int waterAmount = (waterAmountFromUi != null) ? waterAmountFromUi : waterUnit * waterRate;
        int electricityAmount = (elecAmountFromUi != null) ? elecAmountFromUi : electricityUnit * electricityRate;

        Integer subTotal = request.getSubTotal();
        if (subTotal == null) subTotal = rent + waterAmount + electricityAmount;

        Integer netAmount = request.getNetAmount();
        if (netAmount == null) netAmount = subTotal + penalty;

        Integer invoiceStatus = request.getInvoiceStatus() != null ? request.getInvoiceStatus() : 0;

        LocalDateTime dueDate = (request.getDueDate() != null) ? request.getDueDate()
                : createDate.plusDays(30);

        // ----- 2) สร้าง/บันทึก Entity -----
        Invoice inv = new Invoice();
        inv.setCreateDate(createDate);
        inv.setDueDate(dueDate);
        inv.setInvoiceStatus(invoiceStatus);
        inv.setSubTotal(subTotal);
        inv.setPenaltyTotal(penalty);
        inv.setNetAmount(netAmount);

        // ต้องผูก Contract (contact) เพราะ nullable=false
        if (request.getContractId() == null) {
            throw new RuntimeException("contractId is required");
        }
        var contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new RuntimeException("Contract not found: " + request.getContractId()));
        inv.setContact(contract);

        Invoice saved = invoiceRepository.save(inv);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public InvoiceDto updateInvoice(Long id, UpdateInvoiceRequest request) {
        Invoice inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + id));

        // ===== วันที่ครบกำหนด =====
        if (request.getDueDate() != null) {
            inv.setDueDate(request.getDueDate());
        }

        // ===== สถานะ / วันจ่ายจริง =====
        if (request.getInvoiceStatus() != null) {
            inv.setInvoiceStatus(request.getInvoiceStatus());

            // ถ้า set เป็นชำระแล้ว(1) แต่ไม่ส่ง payDate และยังไม่มีค่า → ตั้งเป็น now()
            if (request.getInvoiceStatus() == 1 && request.getPayDate() == null && inv.getPayDate() == null) {
                inv.setPayDate(LocalDateTime.now());
            }
        }
        if (request.getPayDate() != null) {
            inv.setPayDate(request.getPayDate());
        }

        // ===== วิธีชำระ =====
        if (request.getPayMethod() != null) {
            inv.setPayMethod(request.getPayMethod());
        }

        // ===== ยอดเงิน =====
        boolean amountTouched = false;
        if (request.getSubTotal() != null) {
            inv.setSubTotal(Math.max(0, request.getSubTotal()));
            amountTouched = true;
        }
        if (request.getPenaltyTotal() != null) {
            inv.setPenaltyTotal(Math.max(0, request.getPenaltyTotal()));
            amountTouched = true;
        }

        if (request.getPenaltyAppliedAt() != null) {
            inv.setPenaltyAppliedAt(request.getPenaltyAppliedAt());
        }

        if (request.getNetAmount() != null) {
            inv.setNetAmount(Math.max(0, request.getNetAmount()));
        } else if (amountTouched) {
            int st = inv.getSubTotal() != null ? inv.getSubTotal() : 0;
            int pt = inv.getPenaltyTotal() != null ? inv.getPenaltyTotal() : 0;
            inv.setNetAmount(st + pt);
        }

        // notes: Entity ยังไม่มีฟิลด์นี้ — ไม่ทำอะไร

        Invoice saved = invoiceRepository.save(inv);
        return convertToDto(saved);
    }

    @Override
    public void deleteInvoice(Long id) {
        if (invoiceRepository.existsById(id)) {
            invoiceRepository.deleteById(id);
        }
    }

    // ===== Search/Filter (ยังไม่ implement) =====
    @Override public List<InvoiceDto> searchInvoices(String query) { return List.of(); }
    @Override public List<InvoiceDto> getInvoicesByContractId(Long contractId) { return List.of(); }
    @Override public List<InvoiceDto> getInvoicesByRoomId(Long roomId) { return List.of(); }
    @Override public List<InvoiceDto> getInvoicesByTenantId(Long tenantId) { return List.of(); }
    @Override public List<InvoiceDto> getInvoicesByStatus(Integer status) { return List.of(); }
    @Override public List<InvoiceDto> getUnpaidInvoices() { return List.of(); }
    @Override public List<InvoiceDto> getPaidInvoices() { return List.of(); }
    @Override public List<InvoiceDto> getOverdueInvoices() { return List.of(); }
    @Override public List<InvoiceDto> getInvoicesByDateRange(LocalDateTime startDate, LocalDateTime endDate) { return List.of(); }
    @Override public List<InvoiceDto> getInvoicesByNetAmountRange(Integer minAmount, Integer maxAmount) { return List.of(); }
    @Override public InvoiceDto markAsPaid(Long id) { throw new UnsupportedOperationException("markAsPaid not implemented yet"); }
    @Override public InvoiceDto cancelInvoice(Long id) { throw new UnsupportedOperationException("cancelInvoice not implemented yet"); }
    @Override public InvoiceDto addPenalty(Long id, Integer penaltyAmount) { throw new UnsupportedOperationException("addPenalty not implemented yet"); }

    // ===== Utils =====
    private int nullSafeInt(Integer v) { return v != null ? v : 0; }

    private LocalDateTime parseCreateDateOrNow(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDateTime.now();
        try {
            LocalDate d = LocalDate.parse(dateStr);
            return d.atStartOfDay();
        } catch (Exception ex) {
            return LocalDateTime.now();
        }
    }

    // แปลง Invoice -> InvoiceDto
    private InvoiceDto convertToDto(Invoice invoice) {
        return InvoiceDto.builder()
                .id(invoice.getId())
                .contractId(invoice.getContact() != null ? invoice.getContact().getId() : null)
                .createDate(invoice.getCreateDate())
                .dueDate(invoice.getDueDate())
                .invoiceStatus(invoice.getInvoiceStatus())
                .payDate(invoice.getPayDate())
                .payMethod(invoice.getPayMethod())
                .subTotal(invoice.getSubTotal())
                .penaltyTotal(invoice.getPenaltyTotal())
                .netAmount(invoice.getNetAmount())
                .penaltyAppliedAt(invoice.getPenaltyAppliedAt())
                // Tenant info
                .firstName(invoice.getContact() != null && invoice.getContact().getTenant() != null
                        ? invoice.getContact().getTenant().getFirstName() : "N/A")
                .lastName(invoice.getContact() != null && invoice.getContact().getTenant() != null
                        ? invoice.getContact().getTenant().getLastName() : "")
                .nationalId(invoice.getContact() != null && invoice.getContact().getTenant() != null
                        ? invoice.getContact().getTenant().getNationalId() : "")
                .phoneNumber(invoice.getContact() != null && invoice.getContact().getTenant() != null
                        ? invoice.getContact().getTenant().getPhoneNumber() : "")
                .email(invoice.getContact() != null && invoice.getContact().getTenant() != null
                        ? invoice.getContact().getTenant().getEmail() : "")
                // Package info
                .packageName(
                        invoice.getContact() != null
                                && invoice.getContact().getPackagePlan() != null
                                && invoice.getContact().getPackagePlan().getContractType() != null
                                ? invoice.getContact().getPackagePlan().getContractType().getName()
                                : "N/A")
                // Contract dates
                .signDate(invoice.getContact() != null ? invoice.getContact().getSignDate() : null)
                .startDate(invoice.getContact() != null ? invoice.getContact().getStartDate() : null)
                .endDate(invoice.getContact() != null ? invoice.getContact().getEndDate() : null)
                // Room info
                .floor(invoice.getContact() != null && invoice.getContact().getRoom() != null
                        ? invoice.getContact().getRoom().getRoomFloor() : null)
                .room(invoice.getContact() != null && invoice.getContact().getRoom() != null
                        ? invoice.getContact().getRoom().getRoomNumber() : "N/A")
                .rent(invoice.getContact() != null && invoice.getContact().getRentAmountSnapshot() != null
                        ? invoice.getContact().getRentAmountSnapshot().intValue() : 0)
                // Utility estimates (ยังไม่มี invoice item จริง)
                .water(invoice.getSubTotal() != null ? Math.round(invoice.getSubTotal() * 0.2f) : 0)
                .waterUnit(invoice.getSubTotal() != null ? Math.round((invoice.getSubTotal() * 0.2f) / 30) : 0)
                .electricity(invoice.getSubTotal() != null ? Math.round(invoice.getSubTotal() * 0.8f) : 0)
                .electricityUnit(invoice.getSubTotal() != null ? Math.round((invoice.getSubTotal() * 0.8f) / 8) : 0)
                .build();
    }
}
