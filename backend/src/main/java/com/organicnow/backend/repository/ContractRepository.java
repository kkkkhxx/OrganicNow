package com.organicnow.backend.repository;

import com.organicnow.backend.model.Contract;
import com.organicnow.backend.dto.TenantDto;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    // ✅ ดึงข้อมูล TenantDto พร้อม contractTypeId + contractName + status (auto check endDate)
    @Query("""
        select new com.organicnow.backend.dto.TenantDto(
            c.id,
            t.firstName,
            t.lastName,
            r.roomFloor,
            r.roomNumber,
            r.id,
            p.id,
            p.contractType.id,
            p.contractType.name,
            c.startDate,
            c.endDate,
            t.phoneNumber,
            t.email,
            case when c.endDate < CURRENT_TIMESTAMP then 0 else c.status end
        )
        from Contract c
        join c.tenant t
        join c.room r
        join c.packagePlan p
        order by c.signDate desc
    """)
    List<TenantDto> findTenantRows();

    // ✅ ใช้เช็คว่า tenant นี้มีสัญญาที่ยัง active อยู่หรือไม่
    boolean existsByTenant_IdAndStatusAndEndDateAfter(Long tenantId, Integer status, LocalDateTime now);

    // ✅ ใช้สำหรับ Dashboard: เช็กว่าห้องยังมีสัญญาที่ Active อยู่ไหม
    @Query("""
        select case when count(c) > 0 then true else false end
        from Contract c
        where c.room.id = :roomId
          and c.status = 1
          and c.endDate >= CURRENT_TIMESTAMP
    """)
    boolean existsActiveContractByRoomId(Long roomId);

    // ✅ ดึง roomId ที่ยังมีสัญญา active จริง ๆ (ใช้สำหรับ frontend filter ห้องว่าง)
    @Query("""
        select c.room.id
        from Contract c
        where c.status = 1
          and c.endDate >= CURRENT_TIMESTAMP
    """)
    List<Long> findCurrentlyOccupiedRoomIds();

    // ✅ อัปเดตสถานะเป็น 0 สำหรับสัญญาที่หมดอายุแล้ว
    @Modifying
    @Transactional
    @Query("""
        update Contract c 
        set c.status = 0
        where c.endDate < CURRENT_TIMESTAMP
          and c.status = 1
    """)
    int updateExpiredContracts();
}