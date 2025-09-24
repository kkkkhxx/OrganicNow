package com.organicnow.backend.service;

import com.organicnow.backend.dto.AssetDto;
import com.organicnow.backend.dto.RequestDto;
import com.organicnow.backend.dto.RoomDetailDto;
import com.organicnow.backend.repository.AssetRepository;
import com.organicnow.backend.repository.MaintainRepository;
import com.organicnow.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final AssetRepository assetRepository;
    private final MaintainRepository maintainRepository;

    public RoomDetailDto getRoomDetail(Long roomId) {
        RoomDetailDto dto = roomRepository.findRoomDetail(roomId);
        if (dto == null) {
            return null;
        }

        // ✅ ดึง assets และ requests ของห้องนี้
        List<AssetDto> assets = assetRepository.findAssetsByRoomId(roomId);
        List<RequestDto> requests = maintainRepository.findRequestsByRoomId(roomId);

        dto.setAssets(assets);
        dto.setRequests(requests);

        return dto;
    }
}
