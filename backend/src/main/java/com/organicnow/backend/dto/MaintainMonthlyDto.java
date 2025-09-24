package com.organicnow.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintainMonthlyDto {
    private String month;  // YYYY-MM
    private Long total;    // จำนวนรีเควสซ่อม
}
