'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Try to create ENUM type, ignore if it exists
      await queryInterface.sequelize.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_perspectives_categorytype') THEN
            CREATE TYPE "enum_perspectives_categorytype" AS ENUM (
              'demographic', 
              'geographic', 
              'psychographic',
              'sociographic',
              'technographic',
              'professional',
              'economic'
            );
          END IF;
        END $$;
      `);

      await queryInterface.addColumn('Perspectives', 'categoryType', {
        type: Sequelize.ENUM(
          'demographic', 
          'geographic', 
          'psychographic',
          'sociographic',
          'technographic',
          'professional',
          'economic'
        ),
        allowNull: false,
        defaultValue: 'demographic'
      }).catch(error => {
        if (error.message.includes('already exists')) {
          console.log('Column categoryType already exists, skipping...');
        } else {
          throw error;
        }
      });
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Perspectives', 'categoryType');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_perspectives_categorytype";');
  }
}; 