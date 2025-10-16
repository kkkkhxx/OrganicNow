package com.organicnow.backend.controller;

import com.organicnow.backend.model.ContractType;
import com.organicnow.backend.repository.ContractTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ContractTypeControllerIntegrationTest {

    // 🐘 ใช้ Postgres จริงผ่าน Testcontainers
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("organicnow_test")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void registerDataSourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ContractTypeRepository contractTypeRepository;

    @BeforeEach
    void setup() {
        // ล้างข้อมูลและ reset id
        jdbcTemplate.execute("TRUNCATE TABLE contract_type RESTART IDENTITY CASCADE");

        // เพิ่มข้อมูลตัวอย่าง
        contractTypeRepository.save(ContractType.builder()
                .name("Standard Contract")
                .duration(12)
                .build());

        contractTypeRepository.save(ContractType.builder()
                .name("Short Term")
                .duration(6)
                .build());
    }

    // ✅ 1. GET /contract-types
    @Test
    void testGetAllContractTypes_ShouldReturnList() throws Exception {
        mockMvc.perform(get("/contract-types")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("Standard Contract")))
                .andExpect(jsonPath("$[1].duration", is(6)));
    }

    // ✅ 2. GET /contract-types/{id}
    @Test
    void testGetContractTypeById_ShouldReturnCorrectType() throws Exception {
        ContractType saved = contractTypeRepository.findAll().get(0);

        mockMvc.perform(get("/contract-types/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(saved.getId().intValue())))
                .andExpect(jsonPath("$.name", is("Standard Contract")))
                .andExpect(jsonPath("$.duration", is(12)));
    }

    // ✅ 3. POST /contract-types
    @Test
    void testCreateContractType_ShouldReturnCreated() throws Exception {
        String json = """
            {
                "name": "Long Term",
                "duration": 24
            }
        """;

        mockMvc.perform(post("/contract-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Long Term")))
                .andExpect(jsonPath("$.duration", is(24)));

        assert contractTypeRepository.existsById(3L);
    }

    // ✅ 4. DELETE /contract-types/{id}
    @Test
    void testDeleteContractType_ShouldRemoveEntity() throws Exception {
        ContractType existing = contractTypeRepository.findAll().get(0);
        Long id = existing.getId();

        mockMvc.perform(delete("/contract-types/{id}", id))
                .andExpect(status().isNoContent());

        assert contractTypeRepository.findById(id).isEmpty();
    }

    // ✅ 5. GET /contract-types/{id} not found
    @Test
    void testGetContractTypeById_NotFound_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/contract-types/{id}", 999L))
                .andExpect(status().is4xxClientError());
    }
}
