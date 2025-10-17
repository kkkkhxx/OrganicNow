package com.organicnow.backend.schedule;

import com.organicnow.backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.mockito.Mockito.*;

/**
 * ✅ Unit test สำหรับ NotificationScheduler
 * - ทดสอบว่าเรียก service ถูกต้อง
 * - ทดสอบว่าจัดการ exception ได้
 */
class NotificationSchedulerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationScheduler notificationScheduler;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ---------------------------------------------------------
    // 🔹 Test: checkMaintenanceDueNotifications()
    // ---------------------------------------------------------
    @Test
    @DisplayName("checkMaintenanceDueNotifications() → should call service successfully")
    void testCheckMaintenanceDueNotifications_Success() {
        // Arrange & Act
        notificationScheduler.checkMaintenanceDueNotifications();

        // Assert
        verify(notificationService, times(1)).checkAndCreateDueNotifications();
    }

    @Test
    @DisplayName("checkMaintenanceDueNotifications() → should handle exception without throwing")
    void testCheckMaintenanceDueNotifications_ExceptionHandled() {
        // Arrange
        doThrow(new RuntimeException("Simulated failure"))
                .when(notificationService).checkAndCreateDueNotifications();

        // Act (ไม่ควร throw exception ออกมา)
        notificationScheduler.checkMaintenanceDueNotifications();

        // Assert
        verify(notificationService, times(1)).checkAndCreateDueNotifications();
    }

    // ---------------------------------------------------------
    // 🔹 Test: checkMaintenanceDueNotificationsFrequent()
    // ---------------------------------------------------------
    @Test
    @DisplayName("checkMaintenanceDueNotificationsFrequent() → should call service successfully")
    void testCheckMaintenanceDueNotificationsFrequent_Success() {
        notificationScheduler.checkMaintenanceDueNotificationsFrequent();

        verify(notificationService, times(1)).checkAndCreateDueNotifications();
    }

    @Test
    @DisplayName("checkMaintenanceDueNotificationsFrequent() → should handle exception without throwing")
    void testCheckMaintenanceDueNotificationsFrequent_ExceptionHandled() {
        doThrow(new RuntimeException("Simulated frequent failure"))
                .when(notificationService).checkAndCreateDueNotifications();

        notificationScheduler.checkMaintenanceDueNotificationsFrequent();

        verify(notificationService, times(1)).checkAndCreateDueNotifications();
    }
}
