const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Perspective extends Model {
    static associate(models) {
      Perspective.hasMany(models.UserPerspective, {
        foreignKey: 'perspectiveId',
        sourceKey: 'perspectiveId'
      });
    }
  }

  Perspective.init({
    perspectiveId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    perspectiveName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: DataTypes.STRING,
    verificationMethod: {
      type: DataTypes.STRING,
      defaultValue: 'unverified'
    },
    verificationStatus: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    verificationDate: DataTypes.DATE,
    activityScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Perspective',
  });

  return Perspective;
};