package com.organicnow.backend.repository;

import com.organicnow.backend.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {

    // ✅ หา tenant ด้วย nationalId
    Optional<Tenant> findByNationalId(String nationalId);

}