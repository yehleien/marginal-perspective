'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IdmeToken extends Model {
    static associate(models) {
      IdmeToken.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  
  IdmeToken.init({
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
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'IdmeToken',
  });
  
  return IdmeToken;
}; 