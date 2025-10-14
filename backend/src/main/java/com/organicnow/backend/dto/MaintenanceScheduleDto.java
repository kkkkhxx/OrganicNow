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
    private Integer scheduleScope;
    private Long assetGroupId;
    private String assetGroupName;
    private Integer cycleMonth;
    private LocalDateTime lastDoneDate;
    private LocalDateTime nextDueDate;
    private Integer notifyBeforeDate;
    private String scheduleTitle;
    private String scheduleDescription;
}
