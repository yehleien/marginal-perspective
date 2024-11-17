module.exports = (sequelize, DataTypes) => {
  const GmailToken = sequelize.define('GmailToken', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  return GmailToken;
}; 