module.exports = (sequelize, DataTypes) => {
  const IntegrationPerspectiveMap = sequelize.define('IntegrationPerspectiveMap', {
    integrationName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    perspectiveType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    categoryType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['demographic', 'geographic', 'psychographic', 'sociographic', 'technographic', 'professional', 'economic']]
      }
    },
    verificationMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['document', 'professional_network', 'organization', 'education', 'unverified']]
      }
    }
  });

  return IntegrationPerspectiveMap;
}; 