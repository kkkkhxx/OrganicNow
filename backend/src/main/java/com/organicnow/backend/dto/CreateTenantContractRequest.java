package com.organicnow.backend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateTenantContractRequest {
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
    private BigDecimal deposit;
    private BigDecimal rentAmountSnapshot;
}