import { defineConfig } from "cypress";

const urlToTest = "https://mypoi-a68z.onrender.com"; //"http://localhost:3000"

export default defineConfig({
  e2e: {
    baseUrl: urlToTest, //
    setupNodeEvents(on, config) {
      // Nothing to register here for my basic tests (added for redundancy)
    },
    specPattern: "cypress/e2e/**/*.cy.{js,ts}",
    supportFile: false, // I am not using support files
  },
});
