describe("Authentication (std login) testing", () => {
  before(() => {
    // runs once before all tests
    cy.log("Starting standard sign in test");
  });

  beforeEach(() => {
    // runs before each test
    Cypress.on("uncaught:exception", () => false); // to mask nor relevant "uncaught:exception" "error"
    cy.viewport(1280, 800); // needs to be 1024+ for menu being visible
    cy.visit("/");
    cy.document().its("readyState").should("eq", "complete"); // wail until the page is fully loaded
  });

  it("sign in test", () => {
    cy.get('a[href$="/login"]').click(); // click login button
    cy.get('form[action^="/authenticate"]').within(() => {
      cy.contains("label", "Email").should("exist");
      cy.get('input[name="email"]').should("have.attr", "type", "text");

      cy.contains("label", "Password").should("exist");
      cy.get('input[name="password"]').should("have.attr", "type", "password");
    });

    cy.fixture("users").then((users) => {
      const user = users.find((u) => u.id === 1);

      cy.get('input[name="email"]').type(user.email);
      cy.get('input[name="password"]').type(user.password);
      cy.contains("button", "Submit").click();

      cy.url().should("include", "/dashboard"); // if landed at dashboard, means successful authentication :)
    });
  });

  after(() => {
    cy.log("Finished authentication test");
  });
});
