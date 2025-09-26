package com.organicnow.backend.repository;

import com.organicnow.backend.dto.RoomDetailDto;
import com.organicnow.backend.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    @Query("""
    SELECT new com.organicnow.backend.dto.RoomDetailDto(
        r.id, r.roomNumber, r.roomFloor,
        CASE WHEN c.id IS NOT NULL THEN 'occupied' ELSE 'available' END,
        COALESCE(t.firstName, ''), COALESCE(t.lastName, ''),
        COALESCE(t.phoneNumber, ''), COALESCE(t.email, ''),
        COALESCE(ct.name, ''), c.signDate, c.startDate, c.endDate
    )
    FROM Room r
    LEFT JOIN Contract c ON r.id = c.room.id AND c.status = 1
    LEFT JOIN Tenant t ON c.tenant.id = t.id
    LEFT JOIN PackagePlan p ON c.packagePlan.id = p.id
    LEFT JOIN ContractType ct ON p.contractType.id = ct.id
""")
    List<RoomDetailDto> findAllRooms();


    @Query("""
    SELECT new com.organicnow.backend.dto.RoomDetailDto(
        r.id, r.roomNumber, r.roomFloor,
        CASE WHEN c.id IS NOT NULL THEN 'occupied' ELSE 'available' END,
        COALESCE(t.firstName, ''), COALESCE(t.lastName, ''),
        COALESCE(t.phoneNumber, ''), COALESCE(t.email, ''),
        COALESCE(ct.name, ''), c.signDate, c.startDate, c.endDate
    )
    FROM Room r
    LEFT JOIN Contract c ON r.id = c.room.id AND c.status = 1
    LEFT JOIN Tenant t ON c.tenant.id = t.id
    LEFT JOIN PackagePlan p ON c.packagePlan.id = p.id
    LEFT JOIN ContractType ct ON p.contractType.id = ct.id
    WHERE r.id = :roomId
""")
    RoomDetailDto findRoomDetail(@Param("roomId") Long roomId);

    Optional<Room> findByRoomNumber(String roomNumber);
}