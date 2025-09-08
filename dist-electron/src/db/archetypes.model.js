import { db } from "./index";
import { ArchetypeTables } from "./tables/archetypes";
import lodash from "lodash";
const isEmpty = lodash.isEmpty;
const archetypes = ArchetypeTables(db.sequelize, db.dataTypes);
//# sourceMappingURL=archetypes.model.js.map