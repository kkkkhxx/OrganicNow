package com.organicnow.backend.service;

<<<<<<< HEAD
=======


>>>>>>> 478e58059c31d1d62ce26de367c7298f75c2c5f1
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
}
