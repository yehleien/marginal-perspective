'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('Perspectives', 'categoryType', {
        type: Sequelize.STRING,
        validate: {
          isIn: [['demographic', 'geographic', 'psychographic', 'sociographic', 'technographic', 'professional', 'economic']]
        }
      }).catch(error => {
        if (error.message.includes('already exists')) {
          console.log('Column categoryType already exists, skipping...');
        } else {
          throw error;
        }
      }),
      
      queryInterface.addColumn('Perspectives', 'verificationMethod', {
        type: Sequelize.STRING,
        defaultValue: 'unverified'
      }).catch(error => {
        if (error.message.includes('already exists')) {
          console.log('Column verificationMethod already exists, skipping...');
        } else {
          throw error;
        }
      }),
      
      queryInterface.addColumn('Perspectives', 'verificationDate', {
        type: Sequelize.DATE,
        allowNull: true
      }).catch(error => {
        if (error.message.includes('already exists')) {
          console.log('Column verificationDate already exists, skipping...');
        } else {
          throw error;
        }
      }),
      
      queryInterface.addColumn('Perspectives', 'activityScore', {
        type: Sequelize.FLOAT,
        defaultValue: 0
      }).catch(error => {
        if (error.message.includes('already exists')) {
          console.log('Column activityScore already exists, skipping...');
        } else {
          throw error;
        }
      })
    ]);
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('Perspectives', 'categoryType'),
      queryInterface.removeColumn('Perspectives', 'verificationMethod'),
      queryInterface.removeColumn('Perspectives', 'verificationDate'),
      queryInterface.removeColumn('Perspectives', 'activityScore')
    ]);
  }
}; 