'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add columns without creating ENUMs (they already exist)
    return Promise.all([
      queryInterface.addColumn('Perspectives', 'verificationMethod', {
        type: Sequelize.ENUM('document', 'professional_network', 'organization', 'education', 'unverified'),
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
      }),
      queryInterface.addColumn('Perspectives', 'expertiseYears', {
        type: Sequelize.INTEGER,
        allowNull: true
      }).catch(error => {
        if (error.message.includes('already exists')) {
          console.log('Column expertiseYears already exists, skipping...');
        } else {
          throw error;
        }
      }),
      queryInterface.addColumn('Perspectives', 'organization', {
        type: Sequelize.STRING,
        allowNull: true
      }).catch(error => {
        if (error.message.includes('already exists')) {
          console.log('Column organization already exists, skipping...');
        } else {
          throw error;
        }
      }),
      queryInterface.addColumn('Perspectives', 'verificationDocuments', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true
      }).catch(error => {
        if (error.message.includes('already exists')) {
          console.log('Column verificationDocuments already exists, skipping...');
        } else {
          throw error;
        }
      }),
      queryInterface.addColumn('Perspectives', 'verificationStatus', {
        type: Sequelize.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending'
      }).catch(error => {
        if (error.message.includes('already exists')) {
          console.log('Column verificationStatus already exists, skipping...');
        } else {
          throw error;
        }
      })
    ]);
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('Perspectives', 'verificationMethod'),
      queryInterface.removeColumn('Perspectives', 'verificationDate'),
      queryInterface.removeColumn('Perspectives', 'activityScore'),
      queryInterface.removeColumn('Perspectives', 'expertiseYears'),
      queryInterface.removeColumn('Perspectives', 'organization'),
      queryInterface.removeColumn('Perspectives', 'verificationDocuments'),
      queryInterface.removeColumn('Perspectives', 'verificationStatus')
    ]);
  }
}; 