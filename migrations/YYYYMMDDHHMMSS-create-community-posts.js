'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CommunityPosts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      perspectiveId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Perspectives',
          key: 'perspectiveId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('CommunityPosts', ['perspectiveId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CommunityPosts');
  }
}; 