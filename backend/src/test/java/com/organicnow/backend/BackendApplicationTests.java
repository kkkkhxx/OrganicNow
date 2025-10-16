package com.organicnow.backend;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.scheduling.annotation.EnableScheduling;

import static org.assertj.core.api.Assertions.assertThat;

class BackendApplicationTests {

    // ✅ ตรวจสอบว่ามี @EnableScheduling
    @Test
    void backendApplicationShouldHaveEnableSchedulingAnnotation() {
        EnableScheduling annotation = BackendApplication.class.getAnnotation(EnableScheduling.class);
        assertThat(annotation)
                .as("BackendApplication ต้องมี @EnableScheduling")
                .isNotNull();
    }

    // ✅ ตรวจสอบว่า main() เรียก SpringApplication.run() ได้ โดยไม่รันจริง
    @Test
    void mainMethodShouldCallSpringApplicationRunWithoutErrors() {
        try (MockedStatic<org.springframework.boot.SpringApplication> mock = Mockito.mockStatic(org.springframework.boot.SpringApplication.class)) {
            mock.when(() -> org.springframework.boot.SpringApplication.run(BackendApplication.class, new String[]{}))
                    .thenReturn(null); // ป้องกันการรันจริง

            BackendApplication.main(new String[]{});

            // ✅ ตรวจสอบว่ามีการเรียก SpringApplication.run() 1 ครั้ง
            mock.verify(() -> org.springframework.boot.SpringApplication.run(BackendApplication.class, new String[]{}));
        }
    }
}
