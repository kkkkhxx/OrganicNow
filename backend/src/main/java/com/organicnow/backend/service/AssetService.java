package com.organicnow.backend.service;

import com.organicnow.backend.dto.AssetDto;
import com.organicnow.backend.model.Asset;
import com.organicnow.backend.repository.AssetRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssetService {

    private final AssetRepository assetRepository;

    public AssetService(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    // Get all Assets
    public List<AssetDto> getAllAssets() {
        return assetRepository.findAllAssetOptions();
    }

    // Get assets by roomId
    public List<AssetDto> getAssetsByRoomId(Long roomId) {
        return assetRepository.findAssetsByRoomId(roomId);
    }

    // Create Asset
    public Asset createAsset(Asset asset) {
        return assetRepository.save(asset);
    }

    // Update Asset
    public Asset updateAsset(Long id, Asset asset) {
        Asset existingAsset = assetRepository.findById(id).orElseThrow();
        existingAsset.setAssetName(asset.getAssetName());
        existingAsset.setAssetGroup(asset.getAssetGroup());
        return assetRepository.save(existingAsset);
    }

    // Delete Asset
    public void deleteAsset(Long id) {
        assetRepository.deleteById(id);
    }
}