package com.organicnow.backend.service;

import com.organicnow.backend.dto.TenantDto;
import com.organicnow.backend.repository.ContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;

    // ✅ method ดึง tenant list
    public List<TenantDto> getTenantList() {
        return contractRepository.findTenantRows();
    }

    // ✅ method เดิม (occupied rooms)
    public List<Long> getOccupiedRoomIds() {
        return contractRepository.findCurrentlyOccupiedRoomIds();
    }
}