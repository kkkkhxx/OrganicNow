package com.organicnow.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateMaintainRequest {

    private Integer targetType;          // nullable
    private Long roomId;                 // nullable
    private String roomNumber;           // nullable
    private Long roomAssetId;            // nullable

    private Integer issueCategory;       // nullable
    private String issueTitle;           // nullable
    private String issueDescription;     // nullable

    private LocalDateTime scheduledDate; // nullable
    private LocalDateTime finishDate;    // nullable
}
