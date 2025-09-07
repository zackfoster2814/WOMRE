import { Sequelize, Op, DataTypes, QueryTypes } from "sequelize";
import path from "path";
const db = {};
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(process.cwd(), "womre.sqlite"),
    dialectOptions: {
        dateStrings: true,
        typeCast: true
    },
    // logging: false,
    logging: false,
    benchmark: true,
    define: {
        timestamps: false,
        underscored: true
    },
});
export default async function initDb() {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("✅ Database synced");
}
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.dataTypes = DataTypes;
db.QueryTypes = QueryTypes;
db.Op = Op;
export { sequelize, db };
//# sourceMappingURL=index.js.map