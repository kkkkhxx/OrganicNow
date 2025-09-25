package com.organicnow.backend.service;

import com.organicnow.backend.dto.AssetDto;
import com.organicnow.backend.repository.AssetRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssetService {

    private final AssetRepository assetRepository;

    public AssetService(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    // ✅ ดึงรายการ Asset ทั้งหมด (แบบ DTO)
    public List<AssetDto> getAllAssets() {
        return assetRepository.findAllAssetOptions();
    }

    // ✅ ดึงรายการ Asset ตาม roomId
    public List<AssetDto> getAssetsByRoomId(Long roomId) {
        return assetRepository.findAssetsByRoomId(roomId);
    }
}
