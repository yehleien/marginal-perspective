'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('UserEmails', 'verificationCode', {
      type: Sequelize.STRING(6),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('UserEmails', 'verificationCode');
  }
}; 