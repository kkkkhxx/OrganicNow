package com.organicnow.backend.service;

import com.organicnow.backend.dto.AssetGroupDropdownDto;
import com.organicnow.backend.repository.AssetGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssetGroupService {

    private final AssetGroupRepository assetGroupRepository;

    @Transactional(readOnly = true)
    public List<AssetGroupDropdownDto> getAllGroupsForDropdown() {
        return assetGroupRepository.findAll().stream()
                .map(group -> AssetGroupDropdownDto.builder()
                        .id(group.getId())
                        .name(group.getAssetGroupName())
                        .build())
                .toList();
    }
}
