'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Check if new_type column exists
      const checkColumnExists = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'Perspectives' AND column_name = 'new_type'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      if (checkColumnExists.length === 0) {
        // Add a new column if it doesn't exist
        await queryInterface.addColumn('Perspectives', 'new_type', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }

      // Copy data from the old column to the new column
      await queryInterface.sequelize.query(`
        UPDATE "Perspectives"
        SET new_type = type::TEXT
        WHERE new_type IS NULL
      `, { transaction });

      // Check if old 'type' column exists
      const checkOldColumnExists = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'Perspectives' AND column_name = 'type'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      if (checkOldColumnExists.length > 0) {
        // Drop the old column if it exists
        await queryInterface.removeColumn('Perspectives', 'type', { transaction });
      }

      // Rename the new column to the original name if it's not already named 'type'
      const checkNewColumnName = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'Perspectives' AND column_name = 'new_type'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      if (checkNewColumnName.length > 0) {
        await queryInterface.renameColumn('Perspectives', 'new_type', 'type', { transaction });
      }

      // Set NOT NULL constraint on the new column
      await queryInterface.changeColumn('Perspectives', 'type', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'custom'
      }, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    // If you need to revert, you'd need to recreate the enum type
    // This is a simplified version and may need adjustments
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn('Perspectives', 'type', {
        type: Sequelize.ENUM('default', 'custom', 'Custom', 'AnotherType', 'Default'),
        allowNull: false,
        defaultValue: 'custom'
      }, { transaction });
    });
  }
};