describe('ToastContext Component', () => {
  it('should show toast notifications', () => {
    cy.visit('/');
    cy.get('.trigger-toast').click();
    cy.get('.toast-message').should('exist');
  });
});
