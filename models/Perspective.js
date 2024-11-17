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
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'custom'
    },
    options: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
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