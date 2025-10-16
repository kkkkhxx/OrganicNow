describe('NotificationContext Component', () => {
  it('should trigger notifications', () => {
    cy.visit('/');
    cy.get('.trigger-notification').click(); // Assuming there’s a way to trigger notifications
    cy.get('.notification-item').should('exist'); // Notifications should appear
  });
});
