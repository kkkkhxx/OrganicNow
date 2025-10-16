const { defineConfig } = require("cypress");
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:5173', // Set base URL here
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}', // Define spec files
  },
  projectId: "5zi2ou",
};
