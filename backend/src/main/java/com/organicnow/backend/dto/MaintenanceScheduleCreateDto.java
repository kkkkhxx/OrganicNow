package com.organicnow.backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceScheduleCreateDto {
    private Integer scheduleScope;
    private Long assetGroupId;
    private Integer cycleMonth;
    private Integer notifyBeforeDate;
    private String scheduleTitle;
    private String scheduleDescription;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastDoneDate;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime nextDueDate;
}
