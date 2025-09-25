package com.organicnow.backend.controller;

import com.organicnow.backend.dto.AssetDto;
import com.organicnow.backend.dto.ApiResponse;
import com.organicnow.backend.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assets")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:4173"}, allowCredentials = "true")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @GetMapping("/{roomId}")
    public ApiResponse<List<AssetDto>> getAssetsByRoomId(@PathVariable Long roomId) {
        List<AssetDto> assets = assetService.getAssetsByRoomId(roomId);
        return new ApiResponse<>("success", assets);
    }

    @GetMapping("/all")
    public ApiResponse<List<AssetDto>> getAllAssets() {
        List<AssetDto> assets = assetService.getAllAssets();
        return new ApiResponse<>("success", assets);
    }
}
