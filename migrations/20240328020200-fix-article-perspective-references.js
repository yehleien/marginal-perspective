'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Drop foreign key constraint if it exists
      await queryInterface.sequelize.query(`
        ALTER TABLE "Articles" 
        DROP CONSTRAINT IF EXISTS "Articles_perspectiveId_fkey"
      `);

      // Add temp column
      await queryInterface.addColumn('Articles', 'temp_perspective_id', {
        type: Sequelize.STRING
      });

      // Copy and convert existing IDs
      await queryInterface.sequelize.query(`
        UPDATE "Articles" 
        SET temp_perspective_id = "perspectiveId"::text 
        WHERE "perspectiveId" IS NOT NULL
      `);

      // Drop old column and rename new one
      await queryInterface.removeColumn('Articles', 'perspectiveId');
      await queryInterface.renameColumn('Articles', 'temp_perspective_id', 'perspectiveId');

      // Add foreign key constraint back
      await queryInterface.addConstraint('Articles', {
        fields: ['perspectiveId'],
        type: 'foreign key',
        references: {
          table: 'Perspectives',
          field: 'perspectiveId'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });

    } catch (error) {
      console.error('Migration Error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    throw new Error('Cannot reverse this migration');
  }
}; 