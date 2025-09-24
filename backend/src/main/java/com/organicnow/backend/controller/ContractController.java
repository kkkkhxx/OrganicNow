package com.organicnow.backend.controller;

import com.organicnow.backend.dto.TenantDto;
import com.organicnow.backend.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ContractController {

    private final ContractService contractService;

    // ✅ API ดึง tenant list
    @GetMapping("/tenant/list")
    public List<TenantDto> getTenantList() {
        return contractService.getTenantList();
    }

    // ✅ API ดึงห้องที่ยัง occupied จริง ๆ
    @GetMapping("/occupied-rooms")
    public List<Long> getOccupiedRooms() {
        return contractService.getOccupiedRoomIds();
    }
}