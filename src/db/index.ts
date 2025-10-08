import { Sequelize, Op, DataTypes, QueryTypes } from "sequelize";
import path from "path";
import { RelationsConfig } from "./relations/relationsConfig.js";

interface DbConnection {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  dataTypes: typeof DataTypes;
  QueryTypes: typeof QueryTypes;
  Op: typeof Op;
}

const db = {} as DbConnection;

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(process.cwd(), "womre.sqlite"),
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
  },
  // logging: false,
  logging: false,
  benchmark: true,
  define: {
    timestamps: false,
    underscored: true,
  },
});

RelationsConfig(sequelize);

export default async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  console.log("✅ Database synced");
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.dataTypes = DataTypes;
db.QueryTypes = QueryTypes;
db.Op = Op;

export { sequelize, db };
