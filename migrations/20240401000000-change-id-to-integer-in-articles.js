'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Articles', 'id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Articles', 'id', {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
      autoIncrement: false
    });
  }
}; 