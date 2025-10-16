describe('MenuItem Component', () => {
  it('should render menu items correctly', () => {
    cy.visit('/');
    cy.get('.menu-item').should('have.length', 5); // adjust length as needed
  });

  it('should navigate to the correct page when clicked', () => {
    cy.visit('/');
    cy.get('.menu-item').first().click();
    cy.url().should('include', '/expected-page'); // replace with actual URL
  });
});
