package com.organicnow.backend.service;

import com.organicnow.backend.model.Asset;
import com.organicnow.backend.model.AssetGroup;
import com.organicnow.backend.repository.AssetGroupRepository;
import com.organicnow.backend.repository.AssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Testcontainers
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AssetGroupServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("organicnow_test")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private AssetGroupService assetGroupService;

    @Autowired
    private AssetGroupRepository assetGroupRepository;

    @Autowired
    private AssetRepository assetRepository;

    private AssetGroup group1;
    private AssetGroup group2;

    @BeforeEach
    void setup() {
        assetRepository.deleteAll();
        assetGroupRepository.deleteAll();

        group1 = assetGroupRepository.save(AssetGroup.builder().assetGroupName("Furniture").build());
        group2 = assetGroupRepository.save(AssetGroup.builder().assetGroupName("Electronics").build());
    }

    // ✅ 1. Get All
    @Test
    void testGetAllAssetGroups_ShouldReturnAll() {
        List<AssetGroup> groups = assetGroupService.getAllAssetGroups();
        assertEquals(2, groups.size());
        assertTrue(groups.stream().anyMatch(g -> g.getAssetGroupName().equals("Furniture")));
    }

    // ✅ 2. Create New
    @Test
    void testCreateAssetGroup_ShouldSaveSuccessfully() {
        AssetGroup newGroup = AssetGroup.builder().assetGroupName("Appliances").build();
        AssetGroup saved = assetGroupService.createAssetGroup(newGroup);

        assertNotNull(saved.getId());
        assertEquals("Appliances", saved.getAssetGroupName());
        assertEquals(3, assetGroupRepository.count());
    }

    // ✅ 3. Create Duplicate Name
    @Test
    void testCreateAssetGroup_DuplicateName_ShouldThrowException() {
        AssetGroup dup = AssetGroup.builder().assetGroupName("Furniture").build();
        assertThrows(RuntimeException.class, () -> assetGroupService.createAssetGroup(dup));
    }

    // ✅ 4. Update Asset Group
    @Test
    void testUpdateAssetGroup_ShouldUpdateName() {
        AssetGroup updated = assetGroupService.updateAssetGroup(group1.getId(),
                AssetGroup.builder().assetGroupName("Updated Furniture").build());

        assertEquals("Updated Furniture", updated.getAssetGroupName());
        assertTrue(assetGroupRepository.findById(group1.getId()).isPresent());
    }

    // ✅ 5. Update Duplicate Name
    @Test
    void testUpdateAssetGroup_DuplicateName_ShouldThrowError() {
        assertThrows(RuntimeException.class, () ->
                assetGroupService.updateAssetGroup(group1.getId(),
                        AssetGroup.builder().assetGroupName("Electronics").build()));
    }

    // ✅ 6. Delete Asset Group with no assets
    @Test
    void testDeleteAssetGroup_ShouldRemoveSuccessfully() {
        int deletedCount = assetGroupService.deleteAssetGroup(group1.getId());

        assertEquals(0, deletedCount);
        assertFalse(assetGroupRepository.existsById(group1.getId()));
    }

    // ✅ 7. Delete Asset Group with assets inside
    @Test
    void testDeleteAssetGroup_WithAssets_ShouldAlsoDeleteAssets() {
        // เพิ่ม asset 2 ตัวใน group2
        assetRepository.save(Asset.builder().assetName("Chair").assetGroup(group2).status("available").build());
        assetRepository.save(Asset.builder().assetName("Table").assetGroup(group2).status("available").build());

        int deletedCount = assetGroupService.deleteAssetGroup(group2.getId());

        assertEquals(2, deletedCount);
        assertFalse(assetGroupRepository.existsById(group2.getId()));
        assertEquals(0, assetRepository.count());
    }
}
