package com.organicnow.backend.controller;

import com.organicnow.backend.dto.ApiResponse;
import com.organicnow.backend.dto.AssetDto;
import com.organicnow.backend.model.Asset;
import com.organicnow.backend.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assets")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:4173"}, allowCredentials = "true")@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    // Get assets by roomId
    @GetMapping("/{roomId}")
    public ApiResponse<List<AssetDto>> getAssetsByRoomId(@PathVariable Long roomId) {
        List<AssetDto> assets = assetService.getAssetsByRoomId(roomId);
        return new ApiResponse<>("success", assets);
    }

    // Get all assets
    @GetMapping("/all")
    public ApiResponse<List<AssetDto>> getAllAssets() {
        List<AssetDto> assets = assetService.getAllAssets();
        return new ApiResponse<>("success", assets);
    }

    // Create Asset
    @PostMapping("/create")
    public ResponseEntity<Asset> createAsset(@RequestBody Asset asset) {
        return ResponseEntity.status(201).body(assetService.createAsset(asset));
    }

    // Update Asset
    @PutMapping("/update/{id}")
    public ResponseEntity<Asset> updateAsset(@PathVariable Long id, @RequestBody Asset asset) {
        return ResponseEntity.ok(assetService.updateAsset(id, asset));
    }

    // Delete Asset
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {
        assetService.deleteAsset(id);
        return ResponseEntity.noContent().build();
    }
}