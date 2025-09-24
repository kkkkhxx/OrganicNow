package com.organicnow.backend.repository;

import com.organicnow.backend.dto.AssetDto;
import com.organicnow.backend.model.RoomAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomAssetRepository extends JpaRepository<RoomAsset, Long> {

    @Query("""
           SELECT new com.organicnow.backend.dto.AssetDto(
               a.id, a.assetName, ag.assetGroupName
           )
           FROM RoomAsset ra
           JOIN ra.asset a
           JOIN a.assetGroup ag
           WHERE ra.room.id = :roomId
           """)
    List<AssetDto> findAssetsByRoomId(@Param("roomId") Long roomId);
}
