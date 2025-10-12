package com.organicnow.backend.service;

import com.organicnow.backend.dto.AssetDto;
import com.organicnow.backend.model.Asset;
import com.organicnow.backend.model.AssetGroup;
import com.organicnow.backend.repository.AssetGroupRepository;
import com.organicnow.backend.repository.AssetRepository;
import com.organicnow.backend.repository.RoomAssetRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final AssetGroupRepository assetGroupRepository;
    private final RoomAssetRepository roomAssetRepository;

    // ✅ ดูทั้งหมด (stock + ที่ใช้อยู่) แต่ไม่รวม deleted
    public List<AssetDto> getAllAssets() {
        return assetRepository.findAllAssetOptions();
    }

    // ✅ ดึงของของห้อง (ไม่รวม deleted)
    public List<AssetDto> getAssetsByRoomId(Long roomId) {
        return assetRepository.findAssetsByRoomId(roomId);
    }

    // ✅ สร้าง asset เดี่ยว
    public Asset createAsset(Asset asset) {
        if (asset.getStatus() == null || asset.getStatus().isBlank()) {
            asset.setStatus("available");
        }
        return assetRepository.save(asset);
    }

    // ✅ อัปเดตข้อมูล asset เดี่ยว
    public Asset updateAsset(Long id, Asset asset) {
        Asset existing = assetRepository.findById(id).orElseThrow();
        existing.setAssetName(asset.getAssetName());
        existing.setAssetGroup(asset.getAssetGroup());
        if (asset.getStatus() != null && !asset.getStatus().isBlank()) {
            existing.setStatus(asset.getStatus());
        }
        return assetRepository.save(existing);
    }

    // ✅ soft delete: เปลี่ยนสถานะเป็น deleted และตัดออกจากห้องถ้ามี
    @Transactional
    public void softDeleteAsset(Long id) {
        Asset existing = assetRepository.findById(id).orElseThrow();
        // ตัดความสัมพันธ์กับห้องก่อน (ถ้ามี)
        roomAssetRepository.deleteByAsset_Id(id);
        // ตั้งสถานะ deleted
        existing.setStatus("deleted");
        assetRepository.save(existing);
    }

    // ✅ เปลี่ยนสถานะ (เช่น maintenance, broken, available, in_use)
    @Transactional
    public Asset updateStatus(Long id, String status) {
        Asset existing = assetRepository.findById(id).orElseThrow();
        existing.setStatus(status);
        return assetRepository.save(existing);
    }

    // ✅ Bulk create: สร้างของจริงหลายชิ้นในคราวเดียว เช่น โต๊ะ 24 ตัว
    @Transactional
    public List<Asset> createBulk(Long assetGroupId, String assetName, int qty) {
        if (qty <= 0) throw new IllegalArgumentException("qty must be > 0");

        AssetGroup group = assetGroupRepository.findById(assetGroupId)
                .orElseThrow(() -> new IllegalArgumentException("AssetGroup not found"));

        // 🔍 ดึงชื่อทั้งหมดในกลุ่มนี้ที่ขึ้นต้นด้วย assetName (เช่น "table")
        List<Asset> existingAssets = assetRepository.findByAssetGroupId(assetGroupId);
        int maxIndex = existingAssets.stream()
                .filter(a -> a.getAssetName().startsWith(assetName + "-"))
                .mapToInt(a -> {
                    try {
                        return Integer.parseInt(a.getAssetName()
                                .replace(assetName + "-", ""));
                    } catch (NumberFormatException e) {
                        return 0;
                    }
                })
                .max()
                .orElse(0);

        List<Asset> result = new ArrayList<>();
        for (int i = 1; i <= qty; i++) {
            String numberedName = assetName + "-" + String.format("%03d", maxIndex + i); // ✅ เช่น table-001
            Asset a = Asset.builder()
                    .assetGroup(group)
                    .assetName(numberedName)
                    .status("available")
                    .build();
            result.add(a);
        }

        return assetRepository.saveAll(result);
    }

    // ✅ ใช้สำหรับดึงเฉพาะ asset ที่ยังว่าง
    public List<AssetDto> getAvailableAssets() {
        return assetRepository.findAvailableAssets();
    }
}