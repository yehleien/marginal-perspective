'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, find all duplicates
    await queryInterface.sequelize.query(`
      WITH duplicates AS (
        SELECT "perspectiveId", COUNT(*),
               MIN("perspectiveId") as keep_id
        FROM "Perspectives"
        GROUP BY "perspectiveId"
        HAVING COUNT(*) > 1
      )
      DELETE FROM "Perspectives"
      WHERE "perspectiveId" IN (
        SELECT p."perspectiveId"
        FROM "Perspectives" p
        JOIN duplicates d
          ON p."perspectiveId" = d."perspectiveId"
        WHERE p."perspectiveId" != d.keep_id
      );
    `);

    // Now it's safe to create the unique index
    await queryInterface.addIndex('Perspectives', {
      fields: ['perspectiveId'],
      unique: true,
      name: 'perspectives_perspective_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Perspectives', 'perspectives_perspective_id');
  }
}; 