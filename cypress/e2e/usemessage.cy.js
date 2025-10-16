describe('useMessage Hook', () => {
  it('should show a success message when triggered', () => {
    cy.visit('/');
    cy.get('.show-success-button').click();
    cy.get('.success-message').should('be.visible');
  });

  it('should show an error message when triggered', () => {
    cy.visit('/');
    cy.get('.show-error-button').click();
    cy.get('.error-message').should('be.visible');
  });
});
