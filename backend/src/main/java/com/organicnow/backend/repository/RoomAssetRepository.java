package com.organicnow.backend.repository;

import com.organicnow.backend.dto.AssetDto;
import com.organicnow.backend.model.RoomAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomAssetRepository extends JpaRepository<RoomAsset, Long> {

    @Query("""
           SELECT new com.organicnow.backend.dto.AssetDto(
               a.id, a.assetName, ag.assetGroupName, r.roomFloor, r.roomNumber
           )
           FROM RoomAsset ra
           JOIN ra.asset a
           JOIN a.assetGroup ag
           JOIN ra.room r
           WHERE r.id = :roomId
           """)
    List<AssetDto> findAssetsByRoomId(@Param("roomId") Long roomId);

    boolean existsByRoomIdAndAssetId(Long roomId, Long assetId);

    @Query("SELECT ra FROM RoomAsset ra WHERE ra.room.id = :roomId AND ra.asset.id = :assetId")
    Optional<RoomAsset> findByRoomIdAndAssetId(@Param("roomId") Long roomId, @Param("assetId") Long assetId);

    // ✅ เพิ่มเมธอดนี้ เพื่อให้ใช้กับ updateRoomAssets()
    List<RoomAsset> findByRoomId(Long roomId);

    // ใช้ตอน soft delete asset เพื่อตัดออกจากห้อง (ถ้ามี)
    void deleteByAsset_Id(Long assetId);
}