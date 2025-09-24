package com.organicnow.backend.service;

import com.organicnow.backend.repository.ContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContractStatusScheduler {

    private final ContractRepository contractRepository;

    // ✅ รันทุก 1 นาที (ไว้เทส) → พอชัวร์แล้วค่อยเปลี่ยนเป็น "0 0 0 * * *"
    @Scheduled(cron = "0 */1 * * * *")
    @Transactional
    public void updateExpiredContracts() {
        int updated = contractRepository.updateExpiredContracts();
        if (updated > 0) {
            System.out.println("🔄 Updated " + updated + " expired contracts to status=0");
        }
    }
}