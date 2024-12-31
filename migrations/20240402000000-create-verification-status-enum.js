'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_userperspectives_verificationstatus') THEN
          CREATE TYPE "enum_userperspectives_verificationstatus" AS ENUM ('unverified', 'pending', 'verified');
        END IF;
      END
      $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_userperspectives_verificationstatus";
    `);
  }
}; 