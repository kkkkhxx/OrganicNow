// root/cypress.config.js
const { defineConfig } = require("cypress");
const path = require("path");
const Module = require("module");

// helper: require โมดูลจาก frontend/node_modules
const requireFromFrontend = (mod) => {
    const frontendRoot = path.resolve(__dirname, "frontend");
    return Module.createRequire(path.join(frontendRoot, "vite.config.js"))(mod);
};

module.exports = defineConfig({
    projectId: "5zi2ou",
    video: false,
    retries: { runMode: 1, openMode: 0 },

    e2e: {
        baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:5173",
        specPattern: [
            "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
            "frontend/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}"
        ],
        testIsolation: false,
        chromeWebSecurity: false,
        setupNodeEvents(on, config) {
            // 👉 ถ้ารัน CT ค่อยโหลด vite ตอนนี้ (CI ที่รัน E2E จะไม่เข้าบล็อกนี้)
            if (config.testingType === "component") {
                const viteConfig = requireFromFrontend("./frontend/vite.config.js");
                config.component = {
                    devServer: {
                        framework: "react",
                        bundler: "vite",
                        viteConfig,
                    },
                    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
                    supportFile: false,
                };
            }
            return config;
        },
    },
});

