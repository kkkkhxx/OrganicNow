describe('ProtectedRoute Component', () => {
  it('should redirect to login page when not authenticated', () => {
    cy.visit('/protected-page');
    cy.url().should('include', '/login'); // Assuming it redirects to login page
  });

  it('should allow access to protected page when authenticated', () => {
    cy.login(); // Custom command to login (you'll need to set this up)
    cy.visit('/protected-page');
    cy.url().should('include', '/protected-page'); // Page should be accessible
  });
});
