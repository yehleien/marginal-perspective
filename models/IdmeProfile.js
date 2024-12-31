module.exports = (sequelize, DataTypes) => {
  const IdmeProfile = sequelize.define('IdmeProfile', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    attributes: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    status: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    education: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  });

  IdmeProfile.associate = function(models) {
    IdmeProfile.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };

  return IdmeProfile;
};
