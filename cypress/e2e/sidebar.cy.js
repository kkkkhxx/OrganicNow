describe('Sidebar Component', () => {
  it('should be visible by default', () => {
    cy.visit('/');
    cy.get('.sidebar').should('be.visible');
  });

  it('should close when close button is clicked', () => {
    cy.visit('/');
    cy.get('.sidebar-close').click();
    cy.get('.sidebar').should('not.be.visible');
  });
});
