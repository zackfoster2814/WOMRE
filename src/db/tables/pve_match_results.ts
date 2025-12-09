export const PveMatchResultsTable = (sequelize: any, DataTypes: any) => {
  return sequelize.define(
    "PvE_Match_Results",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      player_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      player_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      monster_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      monster_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      player_total: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      monster_total: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      winner: {
        type: DataTypes.TEXT,
        allowNull: false, // 'player' or 'monster' or 'draw'
      },
      match_date: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: () => new Date().toISOString(),
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: true, // JSON string with battle details
      },
    },
    {
      tableName: "PvE_Match_Results",
      timestamps: false,
    }
  );
};
