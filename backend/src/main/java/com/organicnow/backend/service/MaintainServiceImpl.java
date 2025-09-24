package com.organicnow.backend.service;

import com.organicnow.backend.dto.CreateMaintainRequest;
import com.organicnow.backend.dto.MaintainDto;
import com.organicnow.backend.dto.UpdateMaintainRequest;
import com.organicnow.backend.model.Maintain;
import com.organicnow.backend.model.Room;
import com.organicnow.backend.model.RoomAsset;
import com.organicnow.backend.repository.MaintainRepository;
import com.organicnow.backend.repository.RoomAssetRepository;
import com.organicnow.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintainServiceImpl implements MaintainService {

    private final MaintainRepository maintainRepository;
    private final RoomRepository roomRepository;
    private final RoomAssetRepository roomAssetRepository;

    @Override
    public List<MaintainDto> getAll() {
        return maintainRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public java.util.Optional<MaintainDto> getById(Long id) {
        return maintainRepository.findById(id).map(this::toDto);
    }

    @Override
    @Transactional
    public MaintainDto create(CreateMaintainRequest req) {
        validateCreate(req);

        Room room = resolveRoom(req.getRoomId(), req.getRoomNumber());
        RoomAsset asset = resolveAsset(req.getRoomAssetId());

        Maintain m = Maintain.builder()
                .targetType(req.getTargetType())
                .room(room)
                .roomAsset(asset)
                .issueCategory(req.getIssueCategory())
                .issueTitle(req.getIssueTitle())
                .issueDescription(req.getIssueDescription())
                .createDate(req.getCreateDate() != null ? req.getCreateDate() : LocalDateTime.now())
                .scheduledDate(req.getScheduledDate())
                .finishDate(req.getFinishDate())
                .build();

        return toDto(maintainRepository.save(m));
    }

    @Override
    @Transactional
    public MaintainDto update(Long id, UpdateMaintainRequest req) {
        Maintain m = maintainRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Maintain not found: " + id));

        if (req.getTargetType() != null) m.setTargetType(req.getTargetType());

        if (req.getRoomId() != null || (req.getRoomNumber() != null && !req.getRoomNumber().isBlank())) {
            Room room = resolveRoom(req.getRoomId(), req.getRoomNumber());
            m.setRoom(room);
        }

        if (req.getRoomAssetId() != null) {
            RoomAsset asset = resolveAsset(req.getRoomAssetId());
            m.setRoomAsset(asset);
        }

        if (req.getIssueCategory() != null)      m.setIssueCategory(req.getIssueCategory());
        if (req.getIssueTitle() != null)         m.setIssueTitle(req.getIssueTitle());
        if (req.getIssueDescription() != null)   m.setIssueDescription(req.getIssueDescription());
        if (req.getScheduledDate() != null)      m.setScheduledDate(req.getScheduledDate());
        if (req.getFinishDate() != null)         m.setFinishDate(req.getFinishDate());

        return toDto(maintainRepository.save(m));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (maintainRepository.existsById(id)) {
            maintainRepository.deleteById(id);
        }
    }

    // ===== Helpers =====
    private void validateCreate(CreateMaintainRequest req) {
        if (req.getTargetType() == null) throw new IllegalArgumentException("targetType is required");
        if ((req.getRoomId() == null) && (req.getRoomNumber() == null || req.getRoomNumber().isBlank())) {
            throw new IllegalArgumentException("roomId or roomNumber is required");
        }
        if (req.getIssueCategory() == null) throw new IllegalArgumentException("issueCategory is required");
        if (req.getIssueTitle() == null || req.getIssueTitle().isBlank()) {
            throw new IllegalArgumentException("issueTitle is required");
        }
    }

    private Room resolveRoom(Long roomId, String roomNumber) {
        if (roomId != null) {
            return roomRepository.findById(roomId)
                    .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomId));
        }
        return roomRepository.findByRoomNumber(roomNumber)
                .orElseThrow(() -> new IllegalArgumentException("Room not found by number: " + roomNumber));
    }

    private RoomAsset resolveAsset(Long roomAssetId) {
        if (roomAssetId == null) return null;
        return roomAssetRepository.findById(roomAssetId)
                .orElseThrow(() -> new IllegalArgumentException("RoomAsset not found: " + roomAssetId));
    }

    private MaintainDto toDto(Maintain m) {
        return MaintainDto.builder()
                .id(m.getId())
                .targetType(m.getTargetType())
                .roomId(m.getRoom() != null ? m.getRoom().getId() : null)
                .roomNumber(m.getRoom() != null ? m.getRoom().getRoomNumber() : null)
                .roomFloor(m.getRoom() != null ? m.getRoom().getRoomFloor() : null)
                .roomAssetId(m.getRoomAsset() != null ? m.getRoomAsset().getId() : null)
                .issueCategory(m.getIssueCategory())
                .issueTitle(m.getIssueTitle())
                .issueDescription(m.getIssueDescription())
                .createDate(m.getCreateDate())
                .scheduledDate(m.getScheduledDate())
                .finishDate(m.getFinishDate())
                .build();
    }
}
