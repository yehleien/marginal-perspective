'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('UserPerspectives');

    const columnsToAdd = {
      value: {
        type: Sequelize.STRING,
        allowNull: true
      },
      source: {
        type: Sequelize.STRING,
        defaultValue: 'self-reported'
      },
      verificationStatus: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
      }
    };

    for (const [columnName, config] of Object.entries(columnsToAdd)) {
      if (!table[columnName]) {
        await queryInterface.addColumn('UserPerspectives', columnName, config);
      } else {
        console.log(`Column '${columnName}' already exists, skipping...`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const columns = ['value', 'source', 'verificationStatus'];
    for (const column of columns) {
      await queryInterface.removeColumn('UserPerspectives', column).catch(() => {
        console.log(`Column '${column}' does not exist, skipping...`);
      });
    }
  }
}; 