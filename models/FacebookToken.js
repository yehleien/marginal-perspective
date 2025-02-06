const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FacebookToken extends Model {
    static associate(models) {
      FacebookToken.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  
  FacebookToken.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    scope: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'FacebookToken',
  });
  
  return FacebookToken;
}; 