package com.organicnow.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateMaintainRequest {
    private Integer targetType;          // required
    private Long roomId;                 // optional (ถ้าไม่ส่ง ให้ใช้ roomNumber)
    private String roomNumber;           // optional (ช่วยให้ frontend ส่งเลขห้องได้ตรงๆ)
    private Long roomAssetId;            // optional

    private Integer issueCategory;       // required (0..5)
    private String issueTitle;           // required
    private String issueDescription;     // optional

    private LocalDateTime createDate;    // optional (default now)
    private LocalDateTime scheduledDate; // optional
    private LocalDateTime finishDate;    // optional

    // ✅ เพิ่มฟิลด์ใหม่
    private String maintainType;         // optional - ประเภทการซ่อม
    private String technicianName;       // optional - ชื่อช่าง
    private String technicianPhone;      // optional - เบอร์โทรช่าง
}
