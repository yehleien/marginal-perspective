'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Perspectives', 'type', {
      type: Sequelize.STRING,
      allowNull: true
    }).catch(error => {
      if (error.message.includes('already exists')) {
        console.log('Column type already exists, skipping...');
      } else {
        throw error;
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Perspectives', 'type');
  }
}; 