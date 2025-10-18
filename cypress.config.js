// root/cypress.config.js
const { defineConfig } = require("cypress");
const path = require("path");
const Module = require("module");

const requireFromFrontend = (mod) => {
    const frontendRoot = path.resolve(__dirname, "frontend");
    return Module.createRequire(path.join(frontendRoot, "vite.config.js"))(mod);
};

module.exports = defineConfig({
    video: false,
    retries: { runMode: 1, openMode: 0 },

    e2e: {
        baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:5173",
        specPattern: [
            "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
            "frontend/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
        ],
        testIsolation: false,
        chromeWebSecurity: false,
        setupNodeEvents(on, config) {
            if (config.testingType === "component") {
                const viteConfig = requireFromFrontend("./vite.config.js");
                config.component = {
                    devServer: { framework: "react", bundler: "vite", viteConfig },
                    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
                    supportFile: false,
                };
            }
            return config;
        },
    },
});
