describe('Modal Component', () => {
  it('should display modal when triggered', () => {
    cy.visit('/');
    cy.get('.open-modal-button').click(); // Trigger the modal
    cy.get('.modal').should('be.visible');
  });

  it('should close the modal when close button is clicked', () => {
    cy.visit('/');
    cy.get('.open-modal-button').click();
    cy.get('.modal-close').click(); // Assuming close button has this class
    cy.get('.modal').should('not.be.visible');
  });
});
