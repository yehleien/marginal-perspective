 'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First drop the foreign key constraint if it exists
      await queryInterface.sequelize.query(`
        ALTER TABLE "Articles" 
        DROP CONSTRAINT IF EXISTS "Articles_perspectiveId_fkey"
      `);

      // Change the column type to match Perspectives table
      await queryInterface.changeColumn('Articles', 'perspectiveId', {
        type: Sequelize.STRING,
        references: {
          model: 'Perspectives',
          key: 'perspectiveId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

    } catch (error) {
      console.error('Migration Error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Articles', 'perspectiveId', {
      type: Sequelize.BIGINT,
      references: {
        model: 'Perspectives',
        key: 'perspectiveId'
      }
    });
  }
};