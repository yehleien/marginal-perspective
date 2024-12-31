'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Drop foreign key constraints first
      await queryInterface.sequelize.query(`
        ALTER TABLE "Articles" 
        DROP CONSTRAINT IF EXISTS "Articles_perspectiveId_fkey";
        
        ALTER TABLE "Comments" 
        DROP CONSTRAINT IF EXISTS "Comments_perspectiveId_fkey";
        
        ALTER TABLE "CommunityPosts" 
        DROP CONSTRAINT IF EXISTS "CommunityPosts_perspectiveId_fkey";
      `);

      // Change perspectiveId column type in Perspectives table
      await queryInterface.sequelize.query(`
        ALTER TABLE "Perspectives" 
        ALTER COLUMN "perspectiveId" TYPE VARCHAR 
        USING "perspectiveId"::VARCHAR;
      `);

    } catch (error) {
      console.error('Migration Error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Perspectives" 
      ALTER COLUMN "perspectiveId" TYPE BIGINT 
      USING "perspectiveId"::BIGINT;
    `);
  }
}; 