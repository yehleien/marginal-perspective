module.exports = (sequelize, DataTypes) => {
  const Perspective = sequelize.define('Perspective', {
    perspectiveId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    perspectiveName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    categoryType: {
      type: DataTypes.ENUM(
        'demographic', 
        'geographic', 
        'psychographic',
        'sociographic',
        'technographic',
        'professional',
        'economic'
      ),
      allowNull: false,
      defaultValue: 'demographic'
    },
    verificationMethod: {
      type: DataTypes.ENUM('document', 'professional_network', 'organization', 'education', 'unverified'),
      defaultValue: 'unverified'
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    activityScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    expertiseYears: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    organization: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verificationDocuments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending'
    }
  });

  Perspective.associate = function(models) {
    Perspective.hasMany(models.UserPerspective, {
      foreignKey: 'perspectiveId',
      as: 'UserPerspectives'
    });
    
    Perspective.hasMany(models.Comment, {
      foreignKey: 'perspectiveId',
      as: 'comments'
    });
  };

  return Perspective;
};