package com.organicnow.backend.repository;

import com.organicnow.backend.model.MaintenanceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MaintenanceScheduleRepository extends JpaRepository<MaintenanceSchedule, Long> {

    // หา schedule ทั้งหมดของห้อง
    List<MaintenanceSchedule> findByRoomId(Long roomId);

    // หา schedule ทั้งหมดของ roomAsset (กรณีตรวจของในห้อง)
    List<MaintenanceSchedule> findByRoomAssetId(Long roomAssetId);

    // หา schedule ที่จะครบกำหนดก่อนวันที่กำหนด
    List<MaintenanceSchedule> findByNextDueDateBefore(LocalDateTime dueDate);

    // หา schedule ที่ต้องแจ้งเตือนล่วงหน้า
    List<MaintenanceSchedule> findByNextDueDateBetween(LocalDateTime start, LocalDateTime end);
}
