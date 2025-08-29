import { Sequelize } from "sequelize";
import path from "path";
import { UserFactory } from "./models";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(process.cwd(), "womre.sqlite"),
  logging: false,
});

const User = UserFactory(sequelize);

export async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log("✅ Database synced");
}

export { User, sequelize };
