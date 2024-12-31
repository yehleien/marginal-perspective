'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First move existing relationships to UserPerspectives
    await queryInterface.sequelize.query(`
      INSERT INTO "UserPerspectives" ("userId", "perspectiveId")
      SELECT DISTINCT "userId", "perspectiveId"
      FROM "Perspectives"
      WHERE "userId" IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

    // Then remove the column
    await queryInterface.removeColumn('Perspectives', 'userId');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Perspectives', 'userId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
}; 