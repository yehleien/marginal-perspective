'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the enum type if it doesn't exist
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_perspectives_type') THEN
          CREATE TYPE enum_perspectives_type AS ENUM('Default', 'Custom', 'AnotherType', 'spotify');
        END IF;
      END$$;
    `);

    // Check if the Perspectives table exists
    const tableExists = await queryInterface.sequelize.query(`
      SELECT to_regclass('public.Perspectives') IS NOT NULL AS exists;
    `, { type: queryInterface.sequelize.QueryTypes.SELECT });

    if (tableExists[0].exists) {
      // Alter the existing column
      await queryInterface.sequelize.query(`
        ALTER TABLE "Perspectives" 
        ALTER COLUMN "type" TYPE enum_perspectives_type 
        USING ("type"::text::enum_perspectives_type);
      `);
    } else {
      // Create the Perspectives table
      await queryInterface.createTable('Perspectives', {
        perspectiveId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        perspectiveName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        type: {
          type: Sequelize.ENUM('Default', 'Custom', 'AnotherType', 'spotify'),
          allowNull: false,
          defaultValue: 'Custom'
        },
        options: {
          type: Sequelize.JSON,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if the Perspectives table exists
    const tableExists = await queryInterface.sequelize.query(`
      SELECT to_regclass('public.Perspectives') IS NOT NULL AS exists;
    `, { type: queryInterface.sequelize.QueryTypes.SELECT });

    if (tableExists[0].exists) {
      // Remove 'spotify' from the enum type
      await queryInterface.sequelize.query(`
        ALTER TYPE enum_perspectives_type RENAME TO enum_perspectives_type_old;
        CREATE TYPE enum_perspectives_type AS ENUM('Default', 'Custom', 'AnotherType');
        ALTER TABLE "Perspectives" 
        ALTER COLUMN "type" TYPE enum_perspectives_type 
        USING ("type"::text::enum_perspectives_type);
        DROP TYPE enum_perspectives_type_old;
      `);
    } else {
      // If the table doesn't exist, just drop the enum type
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_perspectives_type;
      `);
    }
  }
};