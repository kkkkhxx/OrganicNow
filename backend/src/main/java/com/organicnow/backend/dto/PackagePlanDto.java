package com.organicnow.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PackagePlanDto {

    private Long id;

    private BigDecimal price;

    @JsonProperty("is_active")
    private Integer isActive;

    @JsonProperty("contract_name")
    private String name;

    private Integer duration;

    // ✅ เพิ่มสองฟิลด์ใหม่
    @JsonProperty("contract_type_id")
    private Long contractTypeId;

    @JsonProperty("contract_type_name")
    private String contractTypeName;

    // ✅ Constructor เดิมยังใช้ได้อยู่ (เพื่อความเข้ากันได้ย้อนหลัง)
    public PackagePlanDto(Long id, BigDecimal price, Integer isActive, String name, Integer duration) {
        this.id = id;
        this.price = price;
        this.isActive = isActive;
        this.name = name;
        this.duration = duration;
    }
}