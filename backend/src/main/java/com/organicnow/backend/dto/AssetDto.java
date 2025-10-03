package com.organicnow.backend.dto;

public class AssetDto {
    private Long assetId;
    private String assetName;
    private String assetType;
    private Integer floor;     // 🆕 เพิ่ม floor
    private String room;       // 🆕 เพิ่ม room
    private String status;     // 🆕 เพิ่ม status (เอาไว้โชว์ Active/Inactive)

    public AssetDto() {}

    // Constructor เดิม (ใช้กับ query asset/all)
    public AssetDto(Long assetId, String assetName, String assetType) {
        this.assetId = assetId;
        this.assetName = assetName;
        this.assetType = assetType;
    }

    // 🆕 Constructor ใหม่ (ใช้กับ RoomAssetRepository)
    public AssetDto(Long assetId, String assetName, String assetType, Integer floor, String room) {
        this.assetId = assetId;
        this.assetName = assetName;
        this.assetType = assetType;
        this.floor = floor;
        this.room = room;
        this.status = "Active"; // ค่า default
    }

    // ===== Getters & Setters =====
    public Long getAssetId() { return assetId; }
    public void setAssetId(Long assetId) { this.assetId = assetId; }

    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }

    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}