'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, drop the existing columns (if they exist)
    await queryInterface.removeColumn('UserEmails', 'verificationcode').catch(() => {});
    await queryInterface.removeColumn('UserEmails', 'verificationCode').catch(() => {});
    await queryInterface.removeColumn('UserEmails', 'verificationcodeexpires').catch(() => {});
    await queryInterface.removeColumn('UserEmails', 'verificationCodeExpires').catch(() => {});

    // Then add them back with the correct case
    await queryInterface.addColumn('UserEmails', 'verificationCode', {
      type: Sequelize.STRING(6),
      allowNull: true
    });
    
    await queryInterface.addColumn('UserEmails', 'verificationCodeExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('UserEmails', 'verificationCode');
    await queryInterface.removeColumn('UserEmails', 'verificationCodeExpires');
  }
}; 