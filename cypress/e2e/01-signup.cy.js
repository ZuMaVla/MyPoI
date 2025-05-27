describe("Standard sign up testing", () => {
  before(() => {
    // runs once before all tests
    cy.log("Starting standard sign up test");
  });

  beforeEach(() => {
    // runs before each test
    Cypress.on("uncaught:exception", () => false); // to mask nor relevant "uncaught:exception" "error"
    cy.viewport(1280, 800); // needs to be 1024+ for menu being visible
    cy.visit("/");
    cy.document().its("readyState").should("eq", "complete"); // wait until the page is fully loaded (just in case)
  });

  it("sign up test", () => {
    cy.get('a[href$="/signup"]').click(); // click login button
    cy.get('form[action^="/register"]').within(() => {
      // expect this form with the following content
      cy.contains("label", "Name").should("exist");
      cy.get('input[name="firstName"]').should("exist");
      cy.get('input[name="lastName"]').should("exist");
      cy.contains("label", "Email").should("exist");
      cy.contains("label", "Password").should("exist");
      cy.get("button.button.is-link").should("contain", "Submit");
    });

    cy.fixture("users").then((users) => {
      // filling the form using details of user (id = 1) from fixtures/users.json
      const user = users.find((u) => u.id === 1);

      cy.get('input[name="firstName"]').type(user.first_name);
      cy.get('input[name="lastName"]').type(user.last_name);
      cy.get('input[name="email"]').type(user.email);
      cy.get('input[name="password"]').type(user.password);
      cy.contains("button", "Submit").click();

      cy.url().should("include", "/login"); // expect landing at the loging page i.e. successful sign up :)
    });
  });

  after(() => {
    cy.log("Finished sign up test");
  });
});
