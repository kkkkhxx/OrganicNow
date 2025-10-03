package com.organicnow.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceScheduleDto {
    private Long id;
    private Integer scheduleScope;       // 0 = ตรวจของในห้อง, 1 = ตรวจห้อง
    private Long roomId;                 // FK -> Room
    private Long roomAssetId;            // FK -> RoomAsset (nullable)
    private Integer cycleMonth;
    private LocalDateTime lastDoneDate;
    private LocalDateTime nextDueDate;
    private Integer notifyBeforeDate;
    private String scheduleTitle;
    private String scheduleDescription;
}
