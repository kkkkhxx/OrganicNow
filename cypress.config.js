const { defineConfig } = require("cypress");
const path = require("path");
const fs = require("fs");

// ✅ สร้าง symlink ชี้ vite จาก frontend → root (เพื่อให้ Cypress หาเจอ)
const frontendVitePath = path.resolve(__dirname, "frontend/node_modules/vite");
const rootViteFakePath = path.resolve(__dirname, "node_modules/vite");

if (!fs.existsSync(rootViteFakePath)) {
  try {
    fs.mkdirSync(path.dirname(rootViteFakePath), { recursive: true });
    fs.symlinkSync(frontendVitePath, rootViteFakePath, "junction");
    console.log("✅ Linked vite from frontend -> root/node_modules/vite");
  } catch (e) {
    console.warn("⚠️ Failed to link vite:", e.message);
  }
}

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    testIsolation: false,
       chromeWebSecurity: false,
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig: require(path.resolve(__dirname, "frontend/vite.config.js")),
    },
    specPattern: "cypress/{e2e,component}/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: false, // ❌ ไม่ต้องมี support file
  },

  projectId: "5zi2ou",

  setupNodeEvents(on, config) {
    // ✅ แก้ปัญหา path Windows: ให้ Cypress อนุญาต path ที่เป็น C:/Users/...
    process.env.CYPRESS_INTERNAL_VITE_FS_ALLOW = "C:/Users";

    // ✅ เปลี่ยน working dir ให้ Cypress ทำงานใน frontend
    const frontendDir = path.resolve(__dirname, "frontend");
    process.chdir(frontendDir);
    console.log("👉 Changed working directory to:", frontendDir);

    return config;
  },
});
