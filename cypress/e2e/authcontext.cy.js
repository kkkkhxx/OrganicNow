describe('AuthContext Component', () => {
  it('should provide user info if authenticated', () => {
    cy.login(); // Custom login command
    cy.visit('/');
    cy.get('.user-info').should('contain', 'Username'); // Replace with actual username element
  });
});
