package com.organicnow.backend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** ส่งเฉพาะฟิลด์ที่ต้องการอัปเดต (null = ไม่เปลี่ยน) */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateTenantContractRequest {
    // tenant
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String nationalId;

    // relation
    private Long roomId;
    private Long packageId;

    // contract
    private LocalDateTime signDate;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer status; // 0,1,2,3
    private BigDecimal deposit;
    private BigDecimal rentAmountSnapshot;
}