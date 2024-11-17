'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the Votes table exists
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('Votes'));

    if (!tableExists) {
      // If the table doesn't exist, create it
      await queryInterface.createTable('Votes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        articleId: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        is_upvote: {
          type: Sequelize.BOOLEAN,
          allowNull: false
        },
        is_article_vote: {
          type: Sequelize.BOOLEAN,
          allowNull: false
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
    } else {
      // If the table exists, check if the articleId column exists
      const columns = await queryInterface.describeTable('Votes');
      if (!columns.articleId) {
        // If articleId doesn't exist, add it
        await queryInterface.addColumn('Votes', 'articleId', {
          type: Sequelize.INTEGER,
          allowNull: false
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This migration doesn't need a down function as it's just verifying/fixing the schema
  }
};