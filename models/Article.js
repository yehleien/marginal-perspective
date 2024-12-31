const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    static associate(models) {
      Article.belongsTo(models.Perspective, {
        foreignKey: 'perspectiveId',
        targetKey: 'perspectiveId',
        as: 'Perspective'
      });
    }
  }

  Article.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    url: DataTypes.STRING,
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    submitDate: DataTypes.DATE,
    scope: DataTypes.STRING,
    perspectiveId: {
      type: DataTypes.BIGINT,
      references: {
        model: 'Perspectives',
        key: 'perspectiveId'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Article',
    tableName: 'Articles',
    timestamps: false
  });

  return Article;
};
