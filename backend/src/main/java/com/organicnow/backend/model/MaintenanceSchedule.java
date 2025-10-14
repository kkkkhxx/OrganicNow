package com.organicnow.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_schedule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long id;

    @Min(0)
    @Max(1)
    @Column(name = "schedule_scope", nullable = false)
    private Integer scheduleScope; // 0 = เฉพาะกลุ่ม, 1 = ทั้งระบบ (ตัวอย่าง)

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(
            name = "asset_group_id",
            nullable = true,
            foreignKey = @ForeignKey(name = "fk_schedule_asset_group")
    )
    private AssetGroup assetGroup;

    @Min(1)
    @Column(name = "cycle_month", nullable = false)
    private Integer cycleMonth; // ตรวจทุกๆ กี่เดือน

    @Column(name = "last_done_date")
    private LocalDateTime lastDoneDate; // เวลาล่าสุดที่ตรวจ

    @Column(name = "next_due_date")
    private LocalDateTime nextDueDate; // วันครบกำหนดรอบถัดไป

    @Column(name = "notify_before_date")
    private Integer notifyBeforeDate; // แจ้งล่วงหน้ากี่วัน

    @NotBlank
    @Size(max = 200)
    @Column(name = "schedule_title", nullable = false, length = 200)
    private String scheduleTitle; // หัวข้อ

    @Column(name = "schedule_description", columnDefinition = "TEXT")
    private String scheduleDescription; // รายละเอียด
}
