package com.organicnow.backend.service;

import com.organicnow.backend.dto.PackagePlanDto;
import com.organicnow.backend.dto.PackagePlanRequestDto;
import com.organicnow.backend.model.ContractType;
import com.organicnow.backend.model.PackagePlan;
import com.organicnow.backend.repository.ContractTypeRepository;
import com.organicnow.backend.repository.PackagePlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.NOT_FOUND;

import org.springframework.transaction.annotation.Transactional;

@Service
public class PackagePlanService {

    private final PackagePlanRepository packagePlanRepository;
    private final ContractTypeRepository contractTypeRepository;

    public PackagePlanService(PackagePlanRepository packagePlanRepository,
                              ContractTypeRepository contractTypeRepository) {
        this.packagePlanRepository = packagePlanRepository;
        this.contractTypeRepository = contractTypeRepository;
    }

    public void createPackage(PackagePlanRequestDto dto) {
        // หา ContractType จาก id ที่ส่งมา
        ContractType contractType = contractTypeRepository.findById(dto.getContractTypeId())
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND, "ContractType not found with id " + dto.getContractTypeId()
                ));

        // ปิดการใช้งาน PackagePlan เดิมที่ contractType.name ซ้ำ
        List<PackagePlan> existingPackages =
                packagePlanRepository.findByContractType_NameAndIsActive(contractType.getName(), 1);

        for (PackagePlan oldPlan : existingPackages) {
            oldPlan.setIsActive(0);
            packagePlanRepository.save(oldPlan);
        }

        // สร้าง PackagePlan ใหม่
        PackagePlan packagePlan = PackagePlan.builder()
                .price(dto.getPrice())
                .isActive(dto.getIsActive())
                .contractType(contractType)
                .build();

        packagePlanRepository.save(packagePlan);
    }

    public List<PackagePlanDto> getAllPackages() {
        return packagePlanRepository.findAll()
                .stream()
                .map(p -> new PackagePlanDto(
                        p.getId(),
                        p.getPrice(),
                        p.getIsActive(),
                        p.getContractType().getName(),
                        p.getContractType().getDuration()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public PackagePlanDto togglePackageStatus(Long packageId) {
        PackagePlan pkg = packagePlanRepository.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Package not found"));

        Integer current = pkg.getIsActive() != null ? pkg.getIsActive() : 0;
        pkg.setIsActive(current == 1 ? 0 : 1);
        PackagePlan saved = packagePlanRepository.save(pkg);

        return new PackagePlanDto(
                saved.getId(),
                saved.getPrice(),
                saved.getIsActive(),
                saved.getContractType() != null ? saved.getContractType().getName() : null,
                saved.getContractType() != null ? saved.getContractType().getDuration() : null
        );
    }
}

