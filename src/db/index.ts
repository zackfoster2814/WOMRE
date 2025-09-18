import { Sequelize,Op,DataTypes,QueryTypes } from "sequelize";
import path from "path";
import { PlayerTables } from "./tables/player";
import { RaceTables } from "./tables/races";
import { GearTables } from "./tables/gears";
import { WeaponTables } from "./tables/weapons";
import { PowerTables } from "./tables/power";
import { QuirkTables } from "./tables/quirks";
import { SubRaceTables } from "./tables/sub_race";
import { legacyGearWheel } from "@/Common/Config/GearConfig";
import { HouseTables } from "./tables/houses";
import { ArchetypeTables } from "./tables/archetypes";
import { PlayerArchetypeTables } from "./tables/player_archetypes";
import { PlayerQuirkTables } from "./tables/player_quirks";
import { PlayerGearTables } from "./tables/player_gears";
import { PlayerWeaponTables } from "./tables/player_weapons";
import { CharDevTables } from "./tables/char_dev";
import { EnchantTables } from "./tables/enchants";
import { WeaponEnchantTables } from "./tables/weapon_enchants";
import { PlayerPowerTables } from "./tables/player_power";
import { PveEnemiesTables } from "./tables/pve_enemies";
import { TournamentPhaseTables } from "./tables/tournament_phase";
import { EventEmitterAsyncResource } from "stream";
import { EventTables } from "./tables/event";
import { RewardTables } from "./tables/rewards";
import { MatchTables } from "./tables/matches";
import { MatchEventsTables } from "./tables/match_events";
import { MatchRewardTables } from "./tables/match_reward";
import { PlayerCharDevTables } from "./tables/player_char_dev";

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



export const Players = PlayerTables(db.sequelize, db.dataTypes);

export const Races = RaceTables(db.sequelize, db.dataTypes);
export const Subrace = SubRaceTables(db.sequelize, db.dataTypes);

export const Archetype = ArchetypeTables(db.sequelize, db.dataTypes);
export const Player_Archetypes = PlayerArchetypeTables(db.sequelize, db.dataTypes);

export const Quirks = QuirkTables(db.sequelize, db.dataTypes);
export const Player_Quirks = PlayerQuirkTables(db.sequelize, db.dataTypes);

export const Gears = GearTables(db.sequelize, db.dataTypes);
export const Player_Gear = PlayerGearTables(db.sequelize, db.dataTypes);

export const Weapons = WeaponTables(db.sequelize, db.dataTypes);
export const Player_Weapon = PlayerWeaponTables(db.sequelize, db.dataTypes);

export const Enchant = EnchantTables(db.sequelize, db.dataTypes);
export const Weapon_Enchant = WeaponEnchantTables(db.sequelize, db.dataTypes);

export const Powers = PowerTables(db.sequelize, db.dataTypes);
export const Player_Power = PlayerPowerTables(db.sequelize, db.dataTypes);

export const House = HouseTables(db.sequelize, db.dataTypes);

export const CharDev = CharDevTables(db.sequelize, db.dataTypes);
export const PlayerCharĐev = PlayerCharDevTables(db.sequelize,db.dataTypes);

export const PvE = PveEnemiesTables(db.sequelize, db.dataTypes);

export const TournamentPhase = TournamentPhaseTables(db.sequelize, db.dataTypes);

export const Match = MatchTables(db.sequelize, db.dataTypes);
export const Match_Event = MatchEventsTables(db.sequelize, db.dataTypes);
export const Match_Reward = MatchRewardTables(db.sequelize, db.dataTypes);

export const Event = EventTables(db.sequelize, db.dataTypes);

export const Reward = RewardTables(db.sequelize, db.dataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.dataTypes = DataTypes;
db.QueryTypes = QueryTypes;
db.Op = Op;

export { sequelize, db };
