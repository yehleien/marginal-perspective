const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserEmail extends Model {
    static associate(models) {
      UserEmail.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE'
      });
    }
  }

  UserEmail.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verificationCode: {
      type: DataTypes.STRING(6),
      allowNull: true
    },
    verificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UserEmail',
    timestamps: true
  });

  return UserEmail;
}; 