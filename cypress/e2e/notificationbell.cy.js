describe('NotificationBell Component', () => {
  it('should render notification bell', () => {
    cy.visit('/');
    cy.get('.notification-bell').should('exist');
  });

  it('should display notifications when clicked', () => {
    cy.visit('/');
    cy.get('.notification-bell').click();
    cy.get('.notification-list').should('be.visible'); // Assuming notifications are listed here
  });
});
