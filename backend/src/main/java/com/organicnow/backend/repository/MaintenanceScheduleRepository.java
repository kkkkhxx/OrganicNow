package com.organicnow.backend.repository;

import com.organicnow.backend.model.MaintenanceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceScheduleRepository extends JpaRepository<MaintenanceSchedule, Long> {

    // 🔍 หา schedule ทั้งหมดของ asset group (แทน room เดิม)
    List<MaintenanceSchedule> findByAssetGroupId(Long assetGroupId);

    // 🔍 หา schedule ที่ไม่ได้ผูกกับ asset group (asset_group_id เป็น NULL)
    List<MaintenanceSchedule> findByAssetGroupIsNull();

    // ⏰ หา schedule ที่จะครบกำหนดก่อนวันที่กำหนด
    List<MaintenanceSchedule> findByNextDueDateBefore(LocalDateTime dueDate);

    // ⏰ หา schedule ที่ต้องแจ้งเตือนล่วงหน้า (ระหว่างช่วงเวลา)
    List<MaintenanceSchedule> findByNextDueDateBetween(LocalDateTime start, LocalDateTime end);
}
