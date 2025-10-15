package com.organicnow.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private Long id;
    private String title;
    private String message;
    private String type;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private Long maintenanceScheduleId;
    private String maintenanceScheduleTitle; // เพิ่มข้อมูลจาก MaintenanceSchedule
}