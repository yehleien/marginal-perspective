const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FacebookProfile extends Model {
    static associate(models) {
      FacebookProfile.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  
  FacebookProfile.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    facebookId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    instagramId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    friends: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    likes: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    instagramFollowers: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    instagramFollowing: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'FacebookProfile',
  });
  
  return FacebookProfile;
}; 