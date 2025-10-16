describe('Toast Component', () => {
  it('should render toast notification', () => {
    cy.visit('/');
    cy.get('.toast').should('exist');
  });

  it('should disappear after timeout', () => {
    cy.visit('/');
    cy.get('.toast').should('be.visible');
    cy.wait(5000); // Assuming toast disappears after 5 seconds
    cy.get('.toast').should('not.exist');
  });
});
