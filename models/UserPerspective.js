const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserPerspective extends Model {
    static associate(models) {
      UserPerspective.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      UserPerspective.belongsTo(models.Perspective, {
        foreignKey: 'perspectiveId'
      });
    }
  }

  UserPerspective.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    perspectiveId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: 'self-reported'
    },
    verificationStatus: {
      type: DataTypes.STRING,
      defaultValue: 'unverified',
      validate: {
        isIn: [['unverified', 'pending', 'verified']]
      }
    },
    verificationMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verificationDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    lastVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verificationExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    integrationSource: {
      type: DataTypes.STRING,
      allowNull: true
    },
    integrationId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    confidence: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    },
    history: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'UserPerspective',
    hooks: {
      beforeUpdate: async (perspective, options) => {
        // Track history of changes
        const changes = perspective.changed();
        if (changes) {
          const historyEntry = {
            timestamp: new Date(),
            changes: {},
            previousValues: {}
          };
          
          changes.forEach(field => {
            if (field !== 'history') {
              historyEntry.changes[field] = perspective.getDataValue(field);
              historyEntry.previousValues[field] = perspective.previous(field);
            }
          });
          
          const currentHistory = perspective.getDataValue('history') || [];
          perspective.setDataValue('history', [...currentHistory, historyEntry]);
        }
      }
    }
  });

  return UserPerspective;
};