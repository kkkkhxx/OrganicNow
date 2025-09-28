package com.organicnow.backend.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceScheduleResponse {
    private List<MaintenanceScheduleDto> result;     // ข้อมูล schedule
    private List<AssetGroupDropdownDto> assetGroupDropdown;         // ข้อมูล asset group
}
