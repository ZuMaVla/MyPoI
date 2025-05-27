describe("Welcome Page testing", () => {
  before(() => {
    // runs once before all tests
    cy.log("Starting Welcome Page tests");
  });

  beforeEach(() => {
    // runs before each test
    Cypress.on("uncaught:exception", () => false); // to mask nor relevant "uncaught:exception" "error"
    cy.viewport(1280, 800); // needs to be 1024+ for menu being visible
    cy.visit("/");
  });

  it("loads successfully and shows welcome message", () => {
    cy.contains("Sign up or Log in..."); // what is expected to be desplayed on my welcome page
  });

  it("has a link to login or other main area", () => {
    cy.get('a[href="/login"]').should("exist"); // checking if element redirecting to "/login" is present on the page
  });

  it("has a link to login or other main area", () => {
    cy.get('a[href="/signup"]').should("exist"); // checking if element redirecting to "/signup" is present on the page
  });

  it("has a link to login or other main area", () => {
    cy.get('a[href$="/google"]').should("exist"); // checking if element redirecting to ".../google" is present on the page
  });

  after(() => {
    cy.log("Finished Welcome Page tests");
  });
});
