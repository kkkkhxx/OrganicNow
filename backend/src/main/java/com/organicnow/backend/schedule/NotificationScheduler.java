package com.organicnow.backend.schedule;

import com.organicnow.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final NotificationService notificationService;

    /**
     * ตรวจสอบ maintenance schedules ที่ใกล้ครบกำหนดทุกวันเวลา 09:00
     * cron = "0 0 9 * * *" หมายถึง วินาที นาที ชั่วโมง วัน เดือน ปี
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void checkMaintenanceDueNotifications() {
        log.info("⏰ Running scheduled task: checking for due maintenance schedules");
        try {
            notificationService.checkAndCreateDueNotifications();
        } catch (Exception e) {
            log.error("Error in scheduled notification check", e);
        }
        log.info("⏰ Completed scheduled notification check");
    }

    /**
     * สำหรับการทดสอบ: ตรวจสอบทุกๆ 10 วินาที (เปิดใช้สำหรับ development)
     * เมื่อใช้งานจริงให้เปลี่ยนเป็น fixedRate = 3600000 (1 ชั่วโมง)
     */
    @Scheduled(fixedRate = 3600000) // 10 วินาที = 10,000 มิลลิวินาที
    public void checkMaintenanceDueNotificationsFrequent() {
        log.info("🔄 Running frequent notification check (every 10 seconds)");
        try {
            notificationService.checkAndCreateDueNotifications();
        } catch (Exception e) {
            log.error("Error in frequent notification check", e);
        }
    }
}