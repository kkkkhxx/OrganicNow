package com.organicnow.backend.schedule;

import com.organicnow.backend.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.ScheduledAnnotationBeanPostProcessor;
import org.springframework.test.context.ActiveProfiles;

import static org.mockito.Mockito.*;

/**
 * Integration Test สำหรับ NotificationScheduler
 * - โหลด Spring context จริง
 * - ปิดการ register งาน @Scheduled โดย mock ทั้ง BeanPostProcessor และ TaskScheduler
 *   เพื่อกัน background scheduling 100%
 */
@SpringBootTest(properties = {
        "spring.task.scheduling.enabled=false"  // เผื่อไว้ (แต่เราปิดที่ต้นตอด้วย)
})
@ActiveProfiles("test")
class NotificationSchedulerIntegrationTest {

    @Autowired
    private NotificationScheduler notificationScheduler;

    @MockBean
    private NotificationService notificationService;

    // 🛑 กัน ScheduledAnnotationBeanPostProcessor ไม่ให้ลงทะเบียนงาน @Scheduled
    @MockBean
    private ScheduledAnnotationBeanPostProcessor scheduledAnnotationBeanPostProcessor;

    // 🛑 กัน TaskScheduler (ถ้ามี) ไม่ให้ schedule งานใด ๆ
    @MockBean(name = "taskScheduler")
    private TaskScheduler taskScheduler;

    @Test
    @DisplayName("checkMaintenanceDueNotifications() → เรียก service แค่ครั้งเดียว")
    void testCheckMaintenanceDueNotifications() {
        notificationScheduler.checkMaintenanceDueNotifications();
        verify(notificationService, times(1)).checkAndCreateDueNotifications();
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    @DisplayName("checkMaintenanceDueNotificationsFrequent() → เรียก service แค่ครั้งเดียว")
    void testCheckMaintenanceDueNotificationsFrequent() {
        notificationScheduler.checkMaintenanceDueNotificationsFrequent();
        verify(notificationService, times(1)).checkAndCreateDueNotifications();
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    @DisplayName("จัดการ exception ภายในทั้งสองเมธอด (ไม่ throw ออกมา)")
    void testExceptionHandling() {
        doThrow(new RuntimeException("boom"))
                .when(notificationService).checkAndCreateDueNotifications();

        // เรียกสองเมธอดเอง (ไม่มี background มาช่วยเรียกแล้ว)
        notificationScheduler.checkMaintenanceDueNotifications();
        notificationScheduler.checkMaintenanceDueNotificationsFrequent();

        verify(notificationService, times(2)).checkAndCreateDueNotifications();
        verifyNoMoreInteractions(notificationService);
    }
}
