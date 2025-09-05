import { db } from "./index.ts";
import { fn, col, Op } from "sequelize";
import { ArchetypeTables } from "./tables/archetypes.ts";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const archetypes = ArchetypeTables(db.sequelize, db.dataTypes);
