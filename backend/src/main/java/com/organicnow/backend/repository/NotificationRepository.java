package com.organicnow.backend.repository;

import com.organicnow.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // หา notifications ที่ยังไม่ได้อ่าน
    List<Notification> findByIsReadFalseOrderByCreatedAtDesc();
    
    // หา notifications ทั้งหมด เรียงตามเวลาล่าสุด
    List<Notification> findAllByOrderByCreatedAtDesc();
    
    // นับจำนวน notifications ที่ยังไม่ได้อ่าน
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.isRead = false")
    Long countUnreadNotifications();
    
    // หา notifications ตาม type
    List<Notification> findByTypeOrderByCreatedAtDesc(String type);
    
    // หา notifications ที่เกี่ยวข้องกับ MaintenanceSchedule
    List<Notification> findByMaintenanceScheduleIdOrderByCreatedAtDesc(Long maintenanceScheduleId);
    
    // หา notifications ตาม maintenance schedule id (สำหรับการลบ)
    List<Notification> findByMaintenanceScheduleId(Long maintenanceScheduleId);
}