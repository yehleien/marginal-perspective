'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Drop foreign key constraints first
      await queryInterface.sequelize.query(`
        ALTER TABLE "Comments" DROP CONSTRAINT IF EXISTS "Comments_perspectiveId_fkey";
        ALTER TABLE "CommunityPosts" DROP CONSTRAINT IF EXISTS "CommunityPosts_perspectiveId_fkey";
      `);

      // Add temp UUID column
      await queryInterface.addColumn('Perspectives', 'temp_uuid', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      });

      // Add temp columns to referencing tables
      await queryInterface.addColumn('Comments', 'temp_perspective_id', {
        type: Sequelize.UUID
      });
      await queryInterface.addColumn('CommunityPosts', 'temp_perspective_id', {
        type: Sequelize.UUID
      });

      // Update references
      await queryInterface.sequelize.query(`
        UPDATE "Comments" c
        SET temp_perspective_id = p.temp_uuid
        FROM "Perspectives" p
        WHERE c."perspectiveId" = p."perspectiveId";

        UPDATE "CommunityPosts" cp
        SET temp_perspective_id = p.temp_uuid
        FROM "Perspectives" p
        WHERE cp."perspectiveId" = p."perspectiveId";
      `);

      // Drop old columns and rename new ones
      await queryInterface.removeColumn('Perspectives', 'perspectiveId');
      await queryInterface.renameColumn('Perspectives', 'temp_uuid', 'perspectiveId');

      await queryInterface.removeColumn('Comments', 'perspectiveId');
      await queryInterface.renameColumn('Comments', 'temp_perspective_id', 'perspectiveId');

      await queryInterface.removeColumn('CommunityPosts', 'perspectiveId');
      await queryInterface.renameColumn('CommunityPosts', 'temp_perspective_id', 'perspectiveId');

      // Add back foreign key constraints
      await queryInterface.addConstraint('Comments', {
        fields: ['perspectiveId'],
        type: 'foreign key',
        references: {
          table: 'Perspectives',
          field: 'perspectiveId'
        }
      });

      await queryInterface.addConstraint('CommunityPosts', {
        fields: ['perspectiveId'],
        type: 'foreign key',
        references: {
          table: 'Perspectives',
          field: 'perspectiveId'
        }
      });

    } catch (error) {
      console.error('Migration Error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add rollback logic if needed
  }
};