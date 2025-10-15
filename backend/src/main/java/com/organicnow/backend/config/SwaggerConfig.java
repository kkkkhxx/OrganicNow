package com.organicnow.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "OrganicNow Backend API",
                version = "1.0.0",
                description = "REST API สำหรับระบบบริหารจัดการอพาร์ตเมนต์ (OrganicNow)",
                contact = @Contact(name = "Dev Team", email = "support@organicnow.com"),
                license = @License(name = "Apache 2.0", url = "https://www.apache.org/licenses/LICENSE-2.0")
        )
)
public class SwaggerConfig {}
