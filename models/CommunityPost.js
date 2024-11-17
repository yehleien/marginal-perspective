module.exports = (sequelize, DataTypes) => {
    const CommunityPost = sequelize.define('CommunityPost', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 10000]
            }
        },
        perspectiveId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    CommunityPost.associate = function(models) {
        CommunityPost.belongsTo(models.Perspective, {
            foreignKey: 'perspectiveId'
        });
    };

    return CommunityPost;
}; 