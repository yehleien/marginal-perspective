'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First remove any existing primary key
      await queryInterface.sequelize.query(`
        ALTER TABLE "Perspectives" 
        DROP CONSTRAINT IF EXISTS "Perspectives_pkey"
      `);

      // Add primary key constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE "Perspectives"
        ADD CONSTRAINT "Perspectives_pkey" 
        PRIMARY KEY ("perspectiveId")
      `);

    } catch (error) {
      console.error('Migration Error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Perspectives" 
      DROP CONSTRAINT IF EXISTS "Perspectives_pkey"
    `);
  }
}; 