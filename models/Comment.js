module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    articleId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    perspectiveId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    upvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    downvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    parentID: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    replyCount: {
      type:DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true
  });

  Comment.associate = function(models) {
    Comment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Comment.belongsTo(models.Article, {
      foreignKey: 'articleId',
      as: 'article',
    });
    Comment.belongsTo(models.Perspective, {
      foreignKey: 'perspectiveId',
      as: 'Perspective',
    });
    Comment.hasMany(models.Vote, {
      foreignKey: 'commentId',
      as: 'votes'
    });
    Comment.hasOne(models.UserPerspective, {
      foreignKey: 'userId',
      sourceKey: 'userId',
      constraints: false,
      scope: {
        perspectiveId: sequelize.where(
          sequelize.col('Comment.perspectiveId'),
          '=',
          sequelize.col('UserPerspective.perspectiveId')
        )
      }
    });
  };
  return Comment;
};
