const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.UserEmail, {
        foreignKey: 'userId'
      });
    }
  }

  User.init({
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    birthDate: DataTypes.DATE,
    secondaryEmail: DataTypes.STRING,
    address: DataTypes.STRING,
    profileComplete: DataTypes.BOOLEAN,
    gender: DataTypes.STRING,
    politicalAffiliation: DataTypes.STRING,
    maritalStatus: DataTypes.STRING,
    numberOfChildren: DataTypes.INTEGER,
    education: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User'
  });

  return User;
};
