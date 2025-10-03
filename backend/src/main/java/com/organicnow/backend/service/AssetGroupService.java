package com.organicnow.backend.service;

import com.organicnow.backend.model.Asset;
import com.organicnow.backend.model.AssetGroup;
import com.organicnow.backend.repository.AssetGroupRepository;
import com.organicnow.backend.repository.AssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssetGroupService {

    @Autowired
    private AssetGroupRepository assetGroupRepository;

    @Autowired
    private AssetRepository assetRepository;

    // Get all Asset Groups
    public List<AssetGroup> getAllAssetGroups() {
        return assetGroupRepository.findAll();
    }

    // Create Asset Group
    public AssetGroup createAssetGroup(AssetGroup assetGroup) {
        if (assetGroupRepository.existsByAssetGroupName(assetGroup.getAssetGroupName())) {
            throw new RuntimeException("duplicate_group_name");
        }
        return assetGroupRepository.save(assetGroup);
    }

    // Update Asset Group
    public AssetGroup updateAssetGroup(Long id, AssetGroup assetGroup) {
        AssetGroup existingAssetGroup = assetGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset Group not found with id " + id));

        // ป้องกัน rename ไปซ้ำกับ group อื่น
        if (!existingAssetGroup.getAssetGroupName().equals(assetGroup.getAssetGroupName())
                && assetGroupRepository.existsByAssetGroupName(assetGroup.getAssetGroupName())) {
            throw new RuntimeException("duplicate_group_name");
        }

        existingAssetGroup.setAssetGroupName(assetGroup.getAssetGroupName());
        return assetGroupRepository.save(existingAssetGroup);
    }

    // Delete Asset Group + ลบ Assets ด้วย
    public int deleteAssetGroup(Long id) {
        List<Asset> assets = assetRepository.findByAssetGroupId(id);
        int deletedCount = assets.size();

        if (!assets.isEmpty()) {
            assetRepository.deleteAll(assets);
        }

        assetGroupRepository.deleteById(id);
        return deletedCount;
    }
}