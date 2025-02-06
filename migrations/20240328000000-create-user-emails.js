'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserEmails', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      isPrimary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verificationCode: {
        type: Sequelize.STRING(6),
        allowNull: true
      },
      verificationCodeExpires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserEmails');
  }
}; 