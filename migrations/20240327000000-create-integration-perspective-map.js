module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('IntegrationPerspectiveMap', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      integrationName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      perspectiveType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      categoryType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      verificationMethod: {
        type: Sequelize.STRING,
        allowNull: false
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('IntegrationPerspectiveMap');
  }
}; 