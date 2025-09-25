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

    // ดึงข้อมูลห้องทั้งหมด
    public List<RoomDetailDto> getAllRooms() {
        // ดึงข้อมูลห้องจาก RoomRepository
        return roomRepository.findAllRooms();
    }

    // ดึงข้อมูลห้องตาม roomId
    public RoomDetailDto getRoomDetail(Long roomId) {
        // ดึงข้อมูลห้องจาก RoomRepository
        RoomDetailDto dto = roomRepository.findRoomDetail(roomId);
        if (dto == null) {
            return null;  // ถ้าไม่พบห้อง
        }

        // ดึงข้อมูล assets และ requests จาก repository อื่น
        List<AssetDto> assets = assetRepository.findAssetsByRoomId(roomId);
        List<RequestDto> requests = maintainRepository.findRequestsByRoomId(roomId);

        // ตั้งค่า assets และ requests ใน dto
        dto.setAssets(assets);
        dto.setRequests(requests);

        return dto;
    }
}
