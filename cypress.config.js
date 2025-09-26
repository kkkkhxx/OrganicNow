const { defineConfig } = require("cypress");

module.exports = {
    e2e: {
        baseUrl: 'http://localhost:5173',  // ตั้งค่า base URL ของแอปพลิเคชัน
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}', // กำหนดไฟล์ทดสอบ
    },
};
