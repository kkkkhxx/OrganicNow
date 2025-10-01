package com.organicnow.backend.service;

import com.organicnow.backend.dto.MaintenanceScheduleCreateDto;
import com.organicnow.backend.dto.MaintenanceScheduleDto;
import com.organicnow.backend.model.MaintenanceSchedule;
import com.organicnow.backend.model.Room;
import com.organicnow.backend.model.RoomAsset;
import com.organicnow.backend.repository.MaintenanceScheduleRepository;
import com.organicnow.backend.repository.RoomRepository;
import com.organicnow.backend.repository.RoomAssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MaintenanceScheduleService {

    private final MaintenanceScheduleRepository scheduleRepository;
    private final RoomRepository roomRepository;
    private final RoomAssetRepository roomAssetRepository;

    // 🔹 entity -> dto
    private MaintenanceScheduleDto toDto(MaintenanceSchedule entity) {
        if (entity == null) return null;
        return MaintenanceScheduleDto.builder()
                .id(entity.getId())
                .scheduleScope(entity.getScheduleScope())
                .roomId(entity.getRoom() != null ? entity.getRoom().getId() : null)
                .roomAssetId(entity.getRoomAsset() != null ? entity.getRoomAsset().getId() : null)
                .cycleMonth(entity.getCycleMonth())
                .lastDoneDate(entity.getLastDoneDate())
                .nextDueDate(entity.getNextDueDate())
                .notifyBeforeDate(entity.getNotifyBeforeDate())
                .scheduleTitle(entity.getScheduleTitle())
                .scheduleDescription(entity.getScheduleDescription())
                .build();
    }

    // 🔹 createDto -> entity
    private MaintenanceSchedule toEntity(MaintenanceScheduleCreateDto dto) {
        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found with id " + dto.getRoomId()));
        RoomAsset roomAsset = (dto.getRoomAssetId() != null)
                ? roomAssetRepository.findById(dto.getRoomAssetId()).orElse(null)
                : null;

        return MaintenanceSchedule.builder()
                .scheduleScope(dto.getScheduleScope())
                .room(room)
                .roomAsset(roomAsset)
                .cycleMonth(dto.getCycleMonth())
                .notifyBeforeDate(dto.getNotifyBeforeDate())
                .scheduleTitle(dto.getScheduleTitle())
                .scheduleDescription(dto.getScheduleDescription())
                .build();
    }

    /** ✅ สร้าง schedule ใหม่ */
    @Transactional
    public MaintenanceScheduleDto createSchedule(MaintenanceScheduleCreateDto dto) {
        MaintenanceSchedule schedule = toEntity(dto);
        if (schedule.getNextDueDate() == null && schedule.getLastDoneDate() != null) {
            schedule.setNextDueDate(schedule.getLastDoneDate().plusMonths(schedule.getCycleMonth()));
        }
        return toDto(scheduleRepository.save(schedule));
    }

    /** ✅ อัปเดต schedule */
    @Transactional
    public MaintenanceScheduleDto updateSchedule(Long id, MaintenanceScheduleCreateDto dto) {
        return scheduleRepository.findById(id).map(existing -> {
            existing.setScheduleScope(dto.getScheduleScope());
            existing.setRoom(roomRepository.findById(dto.getRoomId())
                    .orElseThrow(() -> new RuntimeException("Room not found")));
            if (dto.getRoomAssetId() != null) {
                existing.setRoomAsset(roomAssetRepository.findById(dto.getRoomAssetId()).orElse(null));
            } else {
                existing.setRoomAsset(null);
            }
            existing.setCycleMonth(dto.getCycleMonth());
            existing.setNotifyBeforeDate(dto.getNotifyBeforeDate());
            existing.setScheduleTitle(dto.getScheduleTitle());
            existing.setScheduleDescription(dto.getScheduleDescription());
            return toDto(scheduleRepository.save(existing));
        }).orElseThrow(() -> new RuntimeException("Schedule not found with id " + id));
    }

    /** ✅ ดึงทั้งหมด */
    @Transactional(readOnly = true)
    public List<MaintenanceScheduleDto> getAllSchedules() {
        return scheduleRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    /** ✅ ดึงตาม id */
    @Transactional(readOnly = true)
    public Optional<MaintenanceScheduleDto> getScheduleById(Long id) {
        return scheduleRepository.findById(id).map(this::toDto);
    }

    /** ✅ ลบ */
    @Transactional
    public void deleteSchedule(Long id) {
        scheduleRepository.deleteById(id);
    }

    /** ✅ มาร์กว่างานเสร็จแล้ว */
    @Transactional
    public MaintenanceScheduleDto markAsDone(Long id) {
        return scheduleRepository.findById(id).map(schedule -> {
            LocalDateTime now = LocalDateTime.now();
            schedule.setLastDoneDate(now);
            schedule.setNextDueDate(now.plusMonths(schedule.getCycleMonth()));
            return toDto(scheduleRepository.save(schedule));
        }).orElseThrow(() -> new RuntimeException("Schedule not found with id " + id));
    }

    /** ✅ ดึง upcoming schedules */
    @Transactional(readOnly = true)
    public List<MaintenanceScheduleDto> getUpcomingSchedules(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime due = now.plusDays(days);
        return scheduleRepository.findByNextDueDateBetween(now, due).stream()
                .map(this::toDto)
                .toList();
    }
}
