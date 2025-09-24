package com.organicnow.backend.dto;

public class AssetDto {
    private Long assetId;
    private String assetName;
    private String assetType;

    public AssetDto() {}

    public AssetDto(Long assetId, String assetName, String assetType) {
        this.assetId = assetId;
        this.assetName = assetName;
        this.assetType = assetType;
    }

    // ===== Getters & Setters =====
    public Long getAssetId() { return assetId; }
    public void setAssetId(Long assetId) { this.assetId = assetId; }

    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }

    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
}
