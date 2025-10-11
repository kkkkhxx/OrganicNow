package com.organicnow.backend.service;

import com.organicnow.backend.dto.AssetDto;
import com.organicnow.backend.model.Asset;
import com.organicnow.backend.repository.AssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AssetServiceTest {

    @Mock
    private AssetRepository assetRepository;

    @InjectMocks
    private AssetService assetService;

    private Asset sampleAsset;
    private AssetDto sampleAssetDto;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // ✅ mock Asset entity
        sampleAsset = new Asset();
        try {
            sampleAsset.getClass().getMethod("setId", Long.class).invoke(sampleAsset, 1L);
            sampleAsset.getClass().getMethod("setAssetName", String.class).invoke(sampleAsset, "Air Conditioner");
        } catch (Exception ignored) {}

        // ✅ mock AssetDto
        sampleAssetDto = new AssetDto();
        try {
            sampleAssetDto.getClass().getMethod("setId", Long.class).invoke(sampleAssetDto, 1L);
            sampleAssetDto.getClass().getMethod("setAssetName", String.class).invoke(sampleAssetDto, "Air Conditioner");
        } catch (Exception ignored) {}
    }

    // ✅ getAllAssets()
    @Test
    void testGetAllAssets() {
        when(assetRepository.findAllAssetOptions()).thenReturn(List.of(sampleAssetDto));

        List<AssetDto> result = assetService.getAllAssets();

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(assetRepository, times(1)).findAllAssetOptions();
    }

    // ✅ getAssetsByRoomId()
    @Test
    void testGetAssetsByRoomId() {
        when(assetRepository.findAssetsByRoomId(101L)).thenReturn(List.of(sampleAssetDto));

        List<AssetDto> result = assetService.getAssetsByRoomId(101L);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(assetRepository, times(1)).findAssetsByRoomId(101L);
    }

    // ✅ createAsset()
    @Test
    void testCreateAsset() {
        when(assetRepository.save(sampleAsset)).thenReturn(sampleAsset);

        Asset result = assetService.createAsset(sampleAsset);

        assertNotNull(result);
        assertEquals(sampleAsset, result);
        verify(assetRepository, times(1)).save(sampleAsset);
    }

    // ✅ updateAsset() - success
    @Test
    void testUpdateAsset_Success() {
        Asset updateData = new Asset();
        try {
            updateData.getClass().getMethod("setAssetName", String.class).invoke(updateData, "Updated Asset");
        } catch (Exception ignored) {}

        when(assetRepository.findById(1L)).thenReturn(Optional.of(sampleAsset));
        when(assetRepository.save(any(Asset.class))).thenReturn(sampleAsset);

        Asset result = assetService.updateAsset(1L, updateData);

        assertNotNull(result);
        verify(assetRepository, times(1)).findById(1L);
        verify(assetRepository, times(1)).save(any(Asset.class));
    }

    // ✅ updateAsset() - not found
    @Test
    void testUpdateAsset_NotFound() {
        when(assetRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(Exception.class, () -> assetService.updateAsset(99L, sampleAsset));
        verify(assetRepository, times(1)).findById(99L);
        verify(assetRepository, never()).save(any());
    }

    // ✅ deleteAsset()
    @Test
    void testDeleteAsset() {
        doNothing().when(assetRepository).deleteById(1L);

        assetService.deleteAsset(1L);

        verify(assetRepository, times(1)).deleteById(1L);
    }
}
