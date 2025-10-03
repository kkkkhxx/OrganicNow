package com.organicnow.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceScheduleCreateDto {
    private Integer scheduleScope;
    private Long roomId;
    private Long roomAssetId; // nullable
    private Integer cycleMonth;
    private Integer notifyBeforeDate;
    private String scheduleTitle;
    private String scheduleDescription;
}
