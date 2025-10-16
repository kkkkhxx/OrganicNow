describe('useRouteGuard Hook', () => {
  it('should redirect to login if not authenticated', () => {
    cy.visit('/protected');
    cy.url().should('include', '/login');
  });

  it('should allow access if authenticated', () => {
    cy.login(); // Custom login command
    cy.visit('/protected');
    cy.url().should('include', '/protected');
  });
});
