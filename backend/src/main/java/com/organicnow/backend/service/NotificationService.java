package com.organicnow.backend.service;

import com.organicnow.backend.dto.NotificationDto;
import com.organicnow.backend.model.MaintenanceSchedule;

import java.util.List;

public interface NotificationService {
    
    // สร้าง notification ใหม่
    NotificationDto createNotification(String title, String message, String type, MaintenanceSchedule maintenanceSchedule);
    
    // ดึง notifications ทั้งหมด
    List<NotificationDto> getAllNotifications();
    
    // ดึง notifications ที่ยังไม่ได้อ่าน
    List<NotificationDto> getUnreadNotifications();
    
    // นับจำนวน notifications ที่ยังไม่ได้อ่าน
    Long getUnreadCount();
    
    // ทำเครื่องหมายว่าอ่านแล้ว
    NotificationDto markAsRead(Long notificationId);
    
    // ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
    void markAllAsRead();
    
    // ลบ notification
    void deleteNotification(Long notificationId);
    
    // ลบ notifications ทั้งหมดที่เกี่ยวข้องกับ maintenance schedule
    void deleteNotificationsByMaintenanceSchedule(Long maintenanceScheduleId);
    
    // สร้าง notification สำหรับ maintenance schedule ใหม่
    void createMaintenanceScheduleNotification(MaintenanceSchedule maintenanceSchedule);
    
    // ตรวจสอบและสร้าง notification สำหรับ maintenance ที่ใกล้ครบกำหนด
    void checkAndCreateDueNotifications();
}