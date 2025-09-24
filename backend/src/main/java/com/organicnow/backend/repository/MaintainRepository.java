package com.organicnow.backend.repository;

import com.organicnow.backend.dto.RequestDto;
import com.organicnow.backend.model.Maintain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MaintainRepository extends JpaRepository<Maintain, Long> {

    @Query("""
       SELECT new com.organicnow.backend.dto.RequestDto(
           m.id, m.issueTitle, m.issueDescription,
           m.createDate, m.scheduledDate, m.finishDate
       )
       FROM Maintain m
       WHERE m.room.id = :roomId
       """)
    List<RequestDto> findRequestsByRoomId(@Param("roomId") Long roomId);

}
