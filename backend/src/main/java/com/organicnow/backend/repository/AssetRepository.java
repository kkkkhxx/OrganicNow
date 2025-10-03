package com.organicnow.backend.repository;

import com.organicnow.backend.dto.AssetDto;
import com.organicnow.backend.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    // Get assets by roomId
    @Query("""
           SELECT new com.organicnow.backend.dto.AssetDto(
               a.id, a.assetName, ag.assetGroupName, r.roomFloor, r.roomNumber
           )
           FROM Asset a
           JOIN a.assetGroup ag
           JOIN RoomAsset ra ON a.id = ra.asset.id
           JOIN ra.room r
           WHERE r.id = :roomId
           """)
    List<AssetDto> findAssetsByRoomId(@Param("roomId") Long roomId);

    // Get all assets (with group + room info)
    @Query("""
           SELECT new com.organicnow.backend.dto.AssetDto(
               a.id, a.assetName, ag.assetGroupName, r.roomFloor, r.roomNumber
           )
           FROM Asset a
           JOIN a.assetGroup ag
           LEFT JOIN RoomAsset ra ON a.id = ra.asset.id
           LEFT JOIN ra.room r
           """)
    List<AssetDto> findAllAssetOptions();

    // หา assets ของ group
    List<Asset> findByAssetGroupId(Long assetGroupId);
}