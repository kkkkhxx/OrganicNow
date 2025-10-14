package com.organicnow.backend.controller;

import com.organicnow.backend.dto.ApiResponse;
import com.organicnow.backend.dto.NotificationDto;
import com.organicnow.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getAllNotifications() {
        try {
            log.info("📄 API: Getting all notifications");
            List<NotificationDto> notifications = notificationService.getAllNotifications();
            log.info("📄 API: Found {} notifications", notifications.size());
            return ResponseEntity.ok(ApiResponse.success(notifications));
        } catch (Exception e) {
            log.error("Error getting all notifications", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to get notifications: " + e.getMessage()));
        }
    }

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications() {
        try {
            List<NotificationDto> notifications = notificationService.getUnreadNotifications();
            return ResponseEntity.ok(ApiResponse.success(notifications));
        } catch (Exception e) {
            log.error("Error getting unread notifications", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to get unread notifications: " + e.getMessage()));
        }
    }

    @GetMapping("/count/unread")
    public ResponseEntity<?> getUnreadCount() {
        try {
            log.info("🔔 API: Getting unread count");
            Long count = notificationService.getUnreadCount();
            log.info("🔔 API: Unread count = {}", count);
            return ResponseEntity.ok(ApiResponse.success(count));
        } catch (Exception e) {
            log.error("Error getting unread count", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to get unread count: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            NotificationDto notification = notificationService.markAsRead(id);
            return ResponseEntity.ok(ApiResponse.success(notification));
        } catch (Exception e) {
            log.error("Error marking notification as read", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to mark notification as read: " + e.getMessage()));
        }
    }

    @PostMapping("/check-due")
    public ResponseEntity<?> checkDueNotifications() {
        try {
            log.info("🧪 Manual check for due notifications triggered");
            notificationService.checkAndCreateDueNotifications();
            return ResponseEntity.ok(ApiResponse.success("Due notifications check completed"));
        } catch (Exception e) {
            log.error("Error in manual due notifications check", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to check due notifications: " + e.getMessage()));
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        try {
            notificationService.markAllAsRead();
            return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
        } catch (Exception e) {
            log.error("Error marking all notifications as read", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to mark all notifications as read: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        try {
            notificationService.deleteNotification(id);
            return ResponseEntity.ok(ApiResponse.success("Notification deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting notification: {}", id, e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to delete notification: " + e.getMessage()));
        }
    }
}