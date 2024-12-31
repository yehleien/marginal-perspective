const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Define associations here
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    // Add these new fields
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    secondaryEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    profileComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true
    },
    politicalAffiliation: {  // Add this
      type: DataTypes.STRING,
      allowNull: true
    },
    politicalAffiliation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    maritalStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    numberOfChildren: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    education: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        highSchool: {
          graduated: false,
          schoolName: null,
          graduationYear: null
        },
        undergraduate: {
          graduated: false,
          schoolName: null,
          graduationYear: null,
          degree: null,
          major: null
        },
        graduate: {
          graduated: false,
          schoolName: null,
          graduationYear: null,
          degree: null,
          field: null
        },
        doctorate: {
          graduated: false,
          schoolName: null,
          graduationYear: null,
          field: null
        },
        medical: {
          graduated: false,
          schoolName: null,
          graduationYear: null,
          specialty: null
        }
      }
    }
  }, {
    sequelize,
    modelName: 'User'
  });

  return User;
};
