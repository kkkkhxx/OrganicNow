package com.organicnow.backend.service;


import com.organicnow.backend.dto.RequestDto;
import com.organicnow.backend.repository.MaintainRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.organicnow.backend.dto.CreateMaintainRequest;
import com.organicnow.backend.dto.MaintainDto;
import com.organicnow.backend.dto.UpdateMaintainRequest;

import java.util.List;
import java.util.Optional;

public interface MaintainService {
    List<MaintainDto> getAll();
    Optional<MaintainDto> getById(Long id);
    MaintainDto create(CreateMaintainRequest req);
    MaintainDto update(Long id, UpdateMaintainRequest req);
    void delete(Long id);
    List<com.organicnow.backend.dto.RequestDto> getRequestsByRoomId(Long roomId); // เพิ่มจาก branch room
}
