package com.organicnow.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(
        name = "asset",
        uniqueConstraints = @UniqueConstraint(name = "uk_asset_group_asset_name", columnNames = {"asset_group_id", "asset_name"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "asset_id")
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_group_id", nullable = false, foreignKey = @ForeignKey(name = "fk_asset_asset_group"))
    private AssetGroup assetGroup;

    @NotBlank
    @Size(max = 120)
    @Column(name = "asset_name", nullable = false, length = 120)
    private String assetName;

    @NotBlank
    @Size(max = 20)
    @Column(name = "status", nullable = false, length = 20)
    private String status; // available | in_use | maintenance | broken | deleted
}