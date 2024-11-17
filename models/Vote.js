module.exports = (sequelize, DataTypes) => {
    const Vote = sequelize.define('Vote', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      commentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      articleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'articleId', // This maps the JS attribute to the actual DB column name
        references: {
          model: 'Articles', // This is a reference to another model
          key: 'id', // This is the column name of the referenced model
        },},
      is_article_vote: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_upvote: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: null,
      },
    }, {
      timestamps: false,
      freezeTableName: true,
      modelName: 'vote',
    });
  
    Vote.associate = function(models) {
      Vote.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE'
      });
  
      Vote.belongsTo(models.Comment, {
        foreignKey: 'commentId',
        as: 'comment',
      });
    };
  
    return Vote;
  };