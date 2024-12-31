module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('IntegrationPerspectiveMap', [
      {
        integrationName: 'ID.me',
        perspectiveType: 'Student',
        categoryType: 'sociographic',
        verificationMethod: 'education',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        integrationName: 'ID.me',
        perspectiveType: 'Location',
        categoryType: 'geographic',
        verificationMethod: 'document',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        integrationName: 'LinkedIn',
        perspectiveType: 'Professional Background',
        categoryType: 'professional',
        verificationMethod: 'professional_network',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        integrationName: 'LinkedIn',
        perspectiveType: 'Education History',
        categoryType: 'sociographic',
        verificationMethod: 'professional_network',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        integrationName: 'Spotify',
        perspectiveType: 'Music Preferences',
        categoryType: 'psychographic',
        verificationMethod: 'organization',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        integrationName: 'Gmail',
        perspectiveType: 'Communication Patterns',
        categoryType: 'sociographic',
        verificationMethod: 'organization',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        integrationName: 'GitHub',
        perspectiveType: 'Development Skills',
        categoryType: 'professional',
        verificationMethod: 'organization',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        integrationName: 'ID.me',
        perspectiveType: 'Age Verified',
        categoryType: 'demographic',
        verificationMethod: 'document',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('IntegrationPerspectiveMap', null, {});
  }
}; 