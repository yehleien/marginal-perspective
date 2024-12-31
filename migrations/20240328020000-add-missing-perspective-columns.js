'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Perspectives' AND column_name = 'value') THEN
            ALTER TABLE "Perspectives" ADD COLUMN "value" TEXT;
          END IF;

          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Perspectives' AND column_name = 'options') THEN
            ALTER TABLE "Perspectives" ADD COLUMN "options" JSONB DEFAULT '{}';
          END IF;

          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Perspectives' AND column_name = 'metadata') THEN
            ALTER TABLE "Perspectives" ADD COLUMN "metadata" JSONB DEFAULT '{}';
          END IF;
        END $$;
      `);

    } catch (error) {
      console.error('Migration Error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Perspectives" 
      DROP COLUMN IF EXISTS "value",
      DROP COLUMN IF EXISTS "options",
      DROP COLUMN IF EXISTS "metadata";
    `);
  }
}; 