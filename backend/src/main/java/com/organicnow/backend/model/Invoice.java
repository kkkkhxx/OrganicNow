package com.organicnow.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoice")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_id")
    private Long id; // Invoice_id

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_invoice_contact"))
    private Contract contact;   // Contact_id.Contact

    @Column(name = "create_date", nullable = false)
    private LocalDateTime createDate; // วันที่ออกใบแจ้งหนี้

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate; // วันครบกำหนดชำระ

    /** 0=ยังไม่ชำระ, 1=ชำระแล้ว, 2=ยกเลิก */
    @Min(0) @Max(2)
    @Column(name = "invoice_status", nullable = false)
    private Integer invoiceStatus;

    @Column(name = "pay_date")
    private LocalDateTime payDate; // วันที่ชำระจริง (กรอกเมื่อจ่าย)

    @PositiveOrZero
    @Column(name = "pay_method")
    private Integer payMethod; // วิธีชำระ (กำหนดรหัสเองภายหลัง)

    @PositiveOrZero
    @Column(name = "sub_total", nullable = false)
    private Integer subTotal; // ยอดปกติ เช่น ค่าเช่า/น้ำ/ไฟ รวม

    @PositiveOrZero
    @Column(name = "penalty_total", nullable = false)
    private Integer penaltyTotal; // ยอดปรับในบิลนี้

    @PositiveOrZero
    @Column(name = "net_amount", nullable = false)
    private Integer netAmount; // ยอดสุทธิ

    @Column(name = "penalty_applied_at")
    private LocalDateTime penaltyAppliedAt; // วันที่เพิ่ม penalty

    @PrePersist
    void onCreateDefaults() {
        if (createDate == null) createDate = LocalDateTime.now();
        if (subTotal == null) subTotal = 0;
        if (penaltyTotal == null) penaltyTotal = 0;
        if (netAmount == null) netAmount = 0;
        if (invoiceStatus == null) invoiceStatus = 0; // ยังไม่ชำระ
    }
}
