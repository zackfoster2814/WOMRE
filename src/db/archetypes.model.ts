import { db } from "./index";
import { fn, col, Op } from "sequelize";
import { ArchetypeTables } from "./tables/archetypes";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const archetypes = ArchetypeTables(db.sequelize, db.dataTypes);
