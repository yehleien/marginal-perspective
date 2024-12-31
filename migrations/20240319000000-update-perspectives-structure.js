'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns if they don't exist
    const columnsToAdd = {
      'value': {
        type: Sequelize.STRING,
        allowNull: true
      },
      'verificationStatus': {
        type: Sequelize.STRING,
        defaultValue: 'self-reported'
      },
      'verificationDate': {
        type: Sequelize.DATE,
        allowNull: true
      },
      'metadata': {
        type: Sequelize.JSONB,
        defaultValue: {}
      }
    };

    for (const [columnName, config] of Object.entries(columnsToAdd)) {
      await queryInterface.addColumn('UserPerspectives', columnName, config)
        .catch(error => {
          if (!error.message.includes('already exists')) {
            throw error;
          }
        });
    }

    // Add indexes
    await queryInterface.addIndex('UserPerspectives', ['userId'])
      .catch(error => {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      });
  },

  down: async (queryInterface, Sequelize) => {
    const columns = ['value', 'verificationStatus', 'verificationDate', 'metadata'];
    for (const column of columns) {
      await queryInterface.removeColumn('UserPerspectives', column);
    }
    await queryInterface.removeIndex('UserPerspectives', ['userId']);
  }
}; 