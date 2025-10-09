package com.organicnow.backend.service;

import com.organicnow.backend.dto.PackagePlanDto;
import com.organicnow.backend.dto.PackagePlanRequestDto;
import com.organicnow.backend.model.ContractType;
import com.organicnow.backend.model.PackagePlan;
import com.organicnow.backend.repository.ContractTypeRepository;
import com.organicnow.backend.repository.PackagePlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PackagePlanService {

    private final PackagePlanRepository packagePlanRepository;
    private final ContractTypeRepository contractTypeRepository;

    public PackagePlanService(PackagePlanRepository packagePlanRepository,
                              ContractTypeRepository contractTypeRepository) {
        this.packagePlanRepository = packagePlanRepository;
        this.contractTypeRepository = contractTypeRepository;
    }

    // ✅ CREATE package plan
    public void createPackage(PackagePlanRequestDto dto) {
        ContractType contractType = contractTypeRepository.findById(dto.getContractTypeId())
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND, "ContractType not found with id " + dto.getContractTypeId()
                ));

        // deactivate ตัวเก่าที่ชื่อ contract type ซ้ำ
        List<PackagePlan> existingPackages =
                packagePlanRepository.findByContractType_NameAndIsActive(contractType.getName(), 1);

        for (PackagePlan oldPlan : existingPackages) {
            oldPlan.setIsActive(0);
            packagePlanRepository.save(oldPlan);
        }

        // create ใหม่
        PackagePlan packagePlan = PackagePlan.builder()
                .price(dto.getPrice())
                .isActive(dto.getIsActive())
                .contractType(contractType)
                .build();

        packagePlanRepository.save(packagePlan);
    }

    // ✅ GET packages list
    public List<PackagePlanDto> getAllPackages() {
        return packagePlanRepository.findAll()
                .stream()
                .map(p -> {
                    var ct = p.getContractType();
                    return new PackagePlanDto(
                            p.getId(),
                            p.getPrice(),
                            p.getIsActive(),
                            ct != null ? ct.getName() : null,
                            ct != null ? ct.getDuration() : null,
                            ct != null ? ct.getId() : null,        // ✅ เพิ่ม
                            ct != null ? ct.getName() : null       // ✅ เพิ่ม
                    );
                })
                .collect(Collectors.toList());
    }

    // ✅ TOGGLE active status (0 <-> 1)
    @Transactional
    public PackagePlanDto togglePackageStatus(Long packageId) {
        PackagePlan pkg = packagePlanRepository.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Package not found"));

        Integer current = pkg.getIsActive() != null ? pkg.getIsActive() : 0;
        pkg.setIsActive(current == 1 ? 0 : 1);
        PackagePlan saved = packagePlanRepository.save(pkg);

        var ct = saved.getContractType();

        return new PackagePlanDto(
                saved.getId(),
                saved.getPrice(),
                saved.getIsActive(),
                ct != null ? ct.getName() : null,
                ct != null ? ct.getDuration() : null,
                ct != null ? ct.getId() : null,          // ✅ เพิ่ม
                ct != null ? ct.getName() : null         // ✅ เพิ่ม
        );
    }
}