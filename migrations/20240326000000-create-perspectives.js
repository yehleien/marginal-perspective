'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Perspectives', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      perspectiveId: {
        type: Sequelize.STRING,
        unique: true
      },
      perspectiveName: {
        type: Sequelize.STRING
      },
      categoryType: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      options: {
        type: Sequelize.JSON
      },
      verificationMethod: {
        type: Sequelize.STRING,
        defaultValue: 'unverified'
      },
      verificationDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      activityScore: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Perspectives');
  }
}; 