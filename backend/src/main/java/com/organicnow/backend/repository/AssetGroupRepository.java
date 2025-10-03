package com.organicnow.backend.repository;

import com.organicnow.backend.model.AssetGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssetGroupRepository extends JpaRepository<AssetGroup, Long> {
    boolean existsByAssetGroupName(String assetGroupName);
}