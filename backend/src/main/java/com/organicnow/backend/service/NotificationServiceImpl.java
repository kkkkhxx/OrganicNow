package com.organicnow.backend.service;

import com.organicnow.backend.dto.NotificationDto;
import com.organicnow.backend.model.MaintenanceSchedule;
import com.organicnow.backend.model.Notification;
import com.organicnow.backend.repository.MaintenanceScheduleRepository;
import com.organicnow.backend.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final MaintenanceScheduleRepository maintenanceScheduleRepository;

    @Override
    public NotificationDto createNotification(String title, String message, String type, MaintenanceSchedule maintenanceSchedule) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(type)
                .maintenanceSchedule(maintenanceSchedule)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification: {}", saved.getTitle());
        
        return convertToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotifications() {
        return notificationRepository.findByIsReadFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Long getUnreadCount() {
        return notificationRepository.countUnreadNotifications();
    }

    @Override
    public NotificationDto markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));
        
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        
        Notification saved = notificationRepository.save(notification);
        return convertToDto(saved);
    }

    @Override
    public void markAllAsRead() {
        List<Notification> unreadNotifications = notificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
        LocalDateTime now = LocalDateTime.now();
        
        unreadNotifications.forEach(notification -> {
            notification.setIsRead(true);
            notification.setReadAt(now);
        });
        
        notificationRepository.saveAll(unreadNotifications);
        log.info("Marked {} notifications as read", unreadNotifications.size());
    }

    @Override
    public void deleteNotification(Long notificationId) {
        if (!notificationRepository.existsById(notificationId)) {
            throw new RuntimeException("Notification not found: " + notificationId);
        }
        notificationRepository.deleteById(notificationId);
        log.info("Deleted notification: {}", notificationId);
    }

    @Override
    public void deleteNotificationsByMaintenanceSchedule(Long maintenanceScheduleId) {
        List<Notification> notifications = notificationRepository.findByMaintenanceScheduleId(maintenanceScheduleId);
        if (!notifications.isEmpty()) {
            notificationRepository.deleteAll(notifications);
            log.info("Deleted {} notifications for maintenance schedule: {}", notifications.size(), maintenanceScheduleId);
        }
    }

    @Override
    public void createMaintenanceScheduleNotification(MaintenanceSchedule maintenanceSchedule) {
        log.info("🔔 Creating notification for maintenance schedule: {}", maintenanceSchedule.getId());
        String title = "New Maintenance Schedule Created";
        String message = String.format("Maintenance schedule '%s' has been created. Next due date: %s", 
                maintenanceSchedule.getScheduleTitle(),
                maintenanceSchedule.getNextDueDate() != null ? 
                    maintenanceSchedule.getNextDueDate().toLocalDate().toString() : "Not set");
        
        log.info("🔔 Notification details - Title: {}, Message: {}", title, message);
        createNotification(title, message, "MAINTENANCE_SCHEDULE_CREATED", maintenanceSchedule);
        log.info("🔔 Notification created successfully for schedule: {}", maintenanceSchedule.getId());
    }

    @Override
    public void checkAndCreateDueNotifications() {
        log.info("🔔 Checking for due maintenance schedules...");
        List<MaintenanceSchedule> schedules = maintenanceScheduleRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        int notificationCount = 0;
        
        log.info("📅 Current date: {}, Found {} schedules to check", now.toLocalDate(), schedules.size());
        
        for (MaintenanceSchedule schedule : schedules) {
            if (schedule.getNextDueDate() != null) {
                // คำนวณจำนวนวันที่เหลือ
                LocalDate today = now.toLocalDate();
                LocalDate dueDate = schedule.getNextDueDate().toLocalDate();
                long daysUntilDue = today.until(dueDate, java.time.temporal.ChronoUnit.DAYS);
                
                log.info("📋 Schedule '{}' (ID: {}) - Today: {}, Next Due: {}, Days Until Due: {}", 
                        schedule.getScheduleTitle(), schedule.getId(), 
                        today, dueDate, daysUntilDue);
                
                // แจ้งเตือนเมื่อเหลือ 1 วัน หรือครบกำหนดแล้ว (รวมถึงเลยกำหนดไปแล้ว)
                if (daysUntilDue <= 1) {
                    log.info("🎯 Schedule '{}' needs notification (due in {} days)", 
                            schedule.getScheduleTitle(), daysUntilDue);
                    
                    // ตรวจสอบว่ามี notification ประเภทนี้สำหรับ schedule นี้แล้วหรือไม่ (ภายใน 3 วัน)
                    List<Notification> existingNotifications = notificationRepository
                            .findByMaintenanceScheduleIdOrderByCreatedAtDesc(schedule.getId());
                    
                    // ลด timeframe เหลือ 1 วัน เพื่อให้สร้าง notification ได้ง่ายขึ้น
                    boolean hasRecentDueNotification = existingNotifications.stream()
                            .anyMatch(n -> "MAINTENANCE_DUE".equals(n.getType()) && 
                                          n.getCreatedAt().isAfter(now.minusDays(1)));
                    
                    log.info("📝 Existing due notifications for schedule '{}': {}, Has recent (1 day): {}", 
                            schedule.getScheduleTitle(), existingNotifications.size(), hasRecentDueNotification);
                    
                    if (!hasRecentDueNotification) {
                        String title;
                        String message;
                        
                        if (daysUntilDue <= 0) {
                            title = "🚨 Maintenance Due Today!";
                            if (daysUntilDue == 0) {
                                message = String.format("Maintenance '%s' is due TODAY! Please complete as soon as possible.", 
                                        schedule.getScheduleTitle());
                            } else {
                                message = String.format("Maintenance '%s' is OVERDUE by %d days! Please complete immediately.", 
                                        schedule.getScheduleTitle(), Math.abs(daysUntilDue));
                            }
                        } else {
                            title = "⚠️ Maintenance Due Tomorrow";
                            message = String.format("Maintenance '%s' is due tomorrow (%s). Please prepare for completion.", 
                                    schedule.getScheduleTitle(), dueDate.toString());
                        }
                        
                        log.info("🔔 Creating notification: '{}' - '{}'", title, message);
                        createNotification(title, message, "MAINTENANCE_DUE", schedule);
                        notificationCount++;
                        log.info("✅ Created due notification for schedule: {} (due in {} days)", 
                                schedule.getScheduleTitle(), daysUntilDue);
                    } else {
                        log.info("⏭️ Skipped creating notification for schedule '{}' - already exists", 
                                schedule.getScheduleTitle());
                    }
                } else {
                    log.debug("⏳ Schedule '{}' not due yet (due in {} days)", 
                            schedule.getScheduleTitle(), daysUntilDue);
                }
            } else {
                log.debug("📅 Schedule '{}' has no next due date", schedule.getScheduleTitle());
            }
        }
        
        log.info("🔔 Checked {} schedules, created {} due notifications", schedules.size(), notificationCount);
    }

    private NotificationDto convertToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .maintenanceScheduleId(notification.getMaintenanceSchedule() != null ? 
                        notification.getMaintenanceSchedule().getId() : null)
                .maintenanceScheduleTitle(notification.getMaintenanceSchedule() != null ? 
                        notification.getMaintenanceSchedule().getScheduleTitle() : null)
                .build();
    }
}