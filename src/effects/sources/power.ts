/**
 * Power Effects Source
 *
 * Consolidated: data/powers.ts + handlers/immediate/power-handlers.ts + handlers/combat/power-combat-handlers.ts
 */

import { defineEffect } from "../registry";
import { registerImmediateHandler } from "../handlers/registry";
import { registerCombatHandler } from "../handlers/registry";
import type {
  ImmediateHandlerContext,
  ImmediateHandlerResult,
} from "../handlers/types";
import type {
  CombatHandlerContext,
  CombatHandlerResult,
} from "../handlers/types";
import type { StatName } from "../types";

const STAT_NAMES: StatName[] = [
  "strength",
  "speed",
  "durability",
  "iq",
  "biq",
  "ma",
];

// ============================================================================
// IMMEDIATE HANDLERS
// ============================================================================

registerImmediateHandler(
  "quas_wex_exort_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const powers = (ctx.character.powers || []).filter((p: any) => !p.isLost);
    const powerNames = powers.map((p: any) => p.name);
    const hasQuas = powerNames.includes("Quas");
    const hasWex = powerNames.includes("Wex");
    const hasExort = powerNames.includes("Exort");
    if (hasQuas && hasWex && hasExort) {
      return {
        skipDefault: false,
        description: "Invoker unlocked (has Quas+Wex+Exort)",
      };
    }
    return { skipDefault: true, description: "Missing orbs for Invoker" };
  },
  "Check for Invoker orbs combination",
);

registerImmediateHandler(
  "escapade_convert_iq_to_str",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Use raw character IQ (from the txt file) as the baseline, not baseStats.iq which may
    // already include isBase bonuses (e.g. sub-race High Elf +2 IQ). EscAPADe converts ALL
    // IQ added on top of the character's own base stat, including sub-race/pve-reward bonuses.
    const rawIQ = ctx.character.stats?.iq ?? ctx.baseStats.iq;
    const currentIQ = ctx.currentStats.iq;
    const iqBonus = currentIQ - rawIQ;
    if (iqBonus > 0) {
      return {
        statModifiers: [
          { stat: "iq", value: -iqBonus },
          { stat: "strength", value: iqBonus },
        ],
        skipDefault: true,
        description: `Convert +${iqBonus} IQ to +${iqBonus} Strength (EscAPADe)`,
      };
    }
    return { skipDefault: true };
  },
  "Convert IQ bonus to Strength",
);

registerImmediateHandler(
  "weapon_enhancing_modify",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Weapon stats enhanced (passive)",
    };
  },
  "Enhance weapon stats",
);

registerImmediateHandler(
  "quirkful_grant_per_quirk",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const quirkCount = (ctx.character.quirks || []).filter(
      (q: any) => !q.isLost,
    ).length;
    if (quirkCount > 0) {
      return {
        skipDefault: false,
        description: `Will receive ${quirkCount} Power(s) from Quirkful`,
      };
    }
    return { skipDefault: true };
  },
  "Grant Powers based on Quirk count",
);

registerImmediateHandler(
  "quirkless_remove_all_quirks",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "All quirks removed" };
  },
  "Remove all quirks",
);

registerImmediateHandler(
  "sybaurafarming_effect",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const modifiers: Array<{
      stat: StatName;
      value: number;
      isBase?: boolean;
    }> = [];
    let statsChanged = 0;
    for (const stat of STAT_NAMES) {
      if (ctx.baseStats[stat] > 5) {
        const diff = 5 - ctx.baseStats[stat];
        modifiers.push({ stat, value: diff, isBase: true });
        statsChanged++;
      }
    }
    if (statsChanged > 0) {
      return {
        statModifiers: modifiers,
        skipDefault: true,
        description: `${statsChanged} stats capped to 5, will receive ${statsChanged} Quirks`,
      };
    }
    return { skipDefault: true };
  },
  "Cap high stats and grant Quirks",
);

registerImmediateHandler(
  "groundwork_3_powers_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const otherPowerCount = (ctx.character.powers || []).filter(
      (p: any) =>
        !p.isLost && (typeof p === "string" ? p : p.name) !== "Groundwork",
    ).length;
    if (otherPowerCount >= 3) {
      return {
        statModifiers: [
          { stat: "strength", value: 2 },
          { stat: "speed", value: 2 },
        ],
        skipDefault: true,
        description: "Groundwork",
      };
    }
    return { skipDefault: true };
  },
  "+2 Str/Spd with 3+ other Powers",
);

registerImmediateHandler(
  "fist_fighting_remove_weapon",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Weapons removed for Fist Fighting",
    };
  },
  "Remove weapons",
);

registerImmediateHandler(
  "master_of_war_unlock_all_weapons",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "All weapons now usable" };
  },
  "Unlock all weapons",
);

registerImmediateHandler(
  "gate_to_heaven_round_check",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "+1 all stats from Round 32 (passive)",
    };
  },
  "+1 all stats from Round 32",
);

registerImmediateHandler(
  "luck_manipulation_round_64_check",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Luck Manipulation bonus (passive)",
    };
  },
  "Luck bonus from Round 64",
);

registerImmediateHandler(
  "spear_of_fire_2_rune_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const weapons = ctx.character.weapons || [];
    const hasUsableWeapon = weapons.some((w: any) => !w.isLost);
    const charRunes: any[] = (ctx.character as any).runes?.runes || [];
    const activeRuneCount = charRunes.filter((r: any) => !r.isLost).length;
    if (hasUsableWeapon && activeRuneCount >= 2) {
      return {
        skipDefault: false,
        description: "+1 starting point (có vũ khí dùng được + 2 rune)",
      };
    }
    return { skipDefault: true };
  },
  "+1 point if has usable weapon and 2+ active runes",
);

registerImmediateHandler(
  "enhanced_hearing_instrument_check",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "Instrument weakness (passive)" };
  },
  "-1 all vs instrument",
);

registerImmediateHandler(
  "enhanced_hearing_sound_power_check",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "Sound power weakness (passive)" };
  },
  "-2 all vs sound power",
);

registerImmediateHandler(
  "aids_spread_to_lover",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lover = ctx.character.lover as string | string[] | undefined;
    const hasLover = lover && (Array.isArray(lover) ? lover.length > 0 : true);
    if (hasLover) {
      return { skipDefault: true, description: "AIDS spreads to lover(s)" };
    }
    return { skipDefault: true };
  },
  "Spread AIDS to lover",
);

registerImmediateHandler(
  "lone_wolf_check",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Lone Wolf power check (after combat)",
    };
  },
  "Check for other Lone Wolf users",
);

registerImmediateHandler(
  "garlic_breath_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const powers = (ctx.character.powers || []).filter((p: any) => !p.isLost);
    const breathPowers = powers.filter((p: any) => p.name.includes("Breath"));
    if (breathPowers.length >= 3) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
        skipDefault: true,
        description: "+1 all stats (has 3+ Breath powers)",
      };
    }
    return {
      skipDefault: true,
      description: "+1 all stats vs Vampire (combat)",
    };
  },
  "+1 all vs Vampire or with 3 Breath powers",
);

registerImmediateHandler(
  "odin_blessing_convert_to_highest",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "+2 Strength converts to highest stat on loss",
    };
  },
  "Convert Strength bonus to highest stat on loss",
);

registerImmediateHandler(
  "zoltraak_double_biq_round",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "BIQ round plays twice" };
  },
  "Double BIQ round",
);

registerImmediateHandler(
  "uno_reverse_card_swap_debuffs",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Debuffs are swapped between players",
    };
  },
  "Swap debuffs with opponent",
);

registerImmediateHandler(
  "fancy_feet_disable_rune",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "Opponent runes disabled" };
  },
  "Disable opponent runes",
);

registerImmediateHandler(
  "memory_alter_disable_in_combat_power",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Disable opponent "during combat" power',
    };
  },
  "Disable in-combat power",
);

registerImmediateHandler(
  "frost_fingers_per_gear",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "-1 highest stat per gear (max 5)",
    };
  },
  "-1 highest stat per gear",
);

registerImmediateHandler(
  "guidance_fewer_powers_check",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "+1 to 2 random stats if opponent has fewer powers",
    };
  },
  "+1 to 2 stats if opponent has fewer powers",
);

registerImmediateHandler(
  "stat_absorption_opponent_highest",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "+1 to opponent highest stat on win",
    };
  },
  "+1 to opponent highest stat",
);

registerImmediateHandler(
  "bucking_bronco_ma_round_win",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "+1 MA if won MA round and combat (stacks)",
    };
  },
  "+1 MA on MA round win",
);

// Hunter's Mark immediate handler: không làm gì (stat được roll trong BattleZonePage trước combat)
registerImmediateHandler(
  "hunters_mark_random_round",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true };
  },
  "Hunter's Mark: stat roll handled by BattleZonePage pre-combat",
);

registerImmediateHandler(
  "mha_iq_power",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: "iq", value: 7 }],
      skipDefault: true,
      description: "+7 IQ (MHA Power)",
    };
  },
  "+7 IQ from MHA IQ Power",
);

registerImmediateHandler(
  "mha_hellflame",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const mods: ImmediateHandlerResult["statModifiers"] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: 1 });
    }
    return {
      statModifiers: mods,
      skipDefault: true,
      description: "+1 All Stats (MHA Hellflame)",
    };
  },
  "+1 all stats from MHA Hellflame",
);

// ============================================================================
// COMBAT HANDLERS
// ============================================================================

registerCombatHandler(
  "uma2_str_lose",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Chỉ trigger đúng round STR (currentRoundStat === 'str')
    if ((ctx as any).currentRoundStat !== "str") return { skipDefault: true };
    if (ctx.roundResults?.strength === "lose") {
      return {
        selfStatMods: [{ stat: "speed", value: 3 }],
        description: "+3 Speed (lost Strength round)",
      };
    }
    return { skipDefault: true };
  },
  "+3 Speed on Strength round loss",
);

registerCombatHandler(
  "uma2_spd_lose",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Chỉ trigger đúng round SPD (currentRoundStat === 'spd')
    if ((ctx as any).currentRoundStat !== "spd") return { skipDefault: true };
    if (ctx.roundResults?.speed === "lose") {
      return {
        selfStatMods: [{ stat: "durability", value: 4 }],
        description: "+4 Durability (lost Speed round)",
      };
    }
    return { skipDefault: true };
  },
  "+4 Durability on Speed round loss",
);

registerCombatHandler(
  "metamagic_biq_round",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if ((ctx as any).currentRoundStat !== "biq") return { skipDefault: true };
    if (ctx.roundResults?.biq === "win") {
      return { selfPoints: 1, description: "+1 point (BIQ round win)" };
    }
    return { skipDefault: true };
  },
  "+1 point on BIQ round win",
);

registerCombatHandler(
  "armor_piercing_dura_round",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if ((ctx as any).currentRoundStat !== "dur") return { skipDefault: true };
    if (ctx.roundResults?.durability === "win") {
      return { selfPoints: 1, description: "+1 point (Durability round win)" };
    }
    return { skipDefault: true };
  },
  "+1 point on Durability round win",
);

registerCombatHandler(
  "divine_smite_ma_round",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if ((ctx as any).currentRoundStat !== "ma") return { skipDefault: true };
    if (ctx.roundResults?.ma === "win") {
      return { selfPoints: 1, description: "+1 point (MA round win)" };
    }
    return { skipDefault: true };
  },
  "+1 point on MA round win",
);

registerCombatHandler(
  "accelerating_sorcery_count",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const activations = ctx.self.duringCombatActivations || 0;
    if (activations > 0) {
      return {
        selfStatMods: [{ stat: "iq", value: activations }],
        description: `+${activations} IQ (power activations)`,
      };
    }
    return { skipDefault: true };
  },
  "+1 IQ per power activation",
);

registerCombatHandler(
  "homeguard_no_str_lose",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Trigger sau round STR — nếu không thua STR thì +3 Speed
    if ((ctx as any).currentRoundStat !== "str") return { skipDefault: true };
    if (ctx.roundResults?.strength !== "lose") {
      return {
        selfStatMods: [{ stat: "speed", value: 3 }],
        description: "+3 Speed (no Strength loss)",
      };
    }
    return { skipDefault: true };
  },
  "+3 Speed if no Strength round loss",
);

registerCombatHandler(
  "red_shift_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Trigger sau round DUR (round thứ 3) — khi đã có đủ kết quả 3 round đầu
    if ((ctx as any).currentRoundStat !== "dur") return { skipDefault: true };
    const first3 = ["strength", "speed", "durability"];
    const winsInFirst3 = first3.filter(
      (r) => ctx.roundResults?.[r as StatName] === "win",
    ).length;
    if (winsInFirst3 >= 1) {
      return {
        selfStatMods: [
          { stat: "iq", value: 1 },
          { stat: "biq", value: 1 },
          { stat: "ma", value: 2 },
        ],
        description: "+1 IQ, +1 BIQ, +2 MA (won 1+ of first 3)",
      };
    }
    return { skipDefault: true };
  },
  "+1 IQ/BIQ, +2 MA if won 1+ of first 3 rounds",
);

registerCombatHandler(
  "shooting_for_victory_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if ((ctx as any).currentRoundStat !== "dur") return { skipDefault: true };
    const first3 = ["strength", "speed", "durability"];
    const winsInFirst3 = first3.filter(
      (r) => ctx.roundResults?.[r as StatName] === "win",
    ).length;
    const lossesInFirst3 = first3.filter(
      (r) => ctx.roundResults?.[r as StatName] === "lose",
    ).length;
    if (winsInFirst3 >= 1 && lossesInFirst3 >= 1) {
      return {
        selfStatMods: [
          { stat: "iq", value: 1 },
          { stat: "biq", value: 1 },
          { stat: "ma", value: 2 },
        ],
        description: "+1 IQ, +1 BIQ, +2 MA (mixed results in first 3)",
      };
    }
    return { skipDefault: true };
  },
  "+1 IQ/BIQ, +2 MA if mixed results in first 3",
);

registerCombatHandler(
  "pump_iron_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if ((ctx as any).currentRoundStat !== "dur") return { skipDefault: true };
    const first3 = ["strength", "speed", "durability"];
    const winsInFirst3 = first3.filter(
      (r) => ctx.roundResults?.[r as StatName] === "win",
    ).length;
    if (winsInFirst3 === 1) {
      return {
        selfStatMods: [
          { stat: "iq", value: 2 },
          { stat: "biq", value: 2 },
          { stat: "ma", value: 2 },
        ],
        description: "+2 IQ, +2 BIQ, +2 MA (won exactly 1 of first 3)",
      };
    }
    return { skipDefault: true };
  },
  "+2 IQ/BIQ/MA if won exactly 1 of first 3",
);

registerCombatHandler(
  "angling_scheming_str_win",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if ((ctx as any).currentRoundStat !== "str") return { skipDefault: true };
    if (ctx.roundResults?.strength === "win") {
      return {
        selfStatMods: [
          { stat: "iq", value: 1 },
          { stat: "biq", value: 1 },
          { stat: "ma", value: 2 },
        ],
        description: "+1 IQ, +1 BIQ, +2 MA (won Strength)",
      };
    }
    return { skipDefault: true };
  },
  "+1 IQ/BIQ, +2 MA on Strength round win",
);

registerCombatHandler(
  "no_stopping_me_alternating_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const first3 = ["strength", "speed", "durability"];
    const results = first3.map((r) => ctx.roundResults?.[r as StatName]);
    const isAlternating =
      (results[0] === "win" && results[1] === "lose" && results[2] === "win") ||
      (results[0] === "lose" && results[1] === "win" && results[2] === "lose");
    if (isAlternating) {
      return {
        selfStatMods: [
          { stat: "iq", value: 3 },
          { stat: "biq", value: 3 },
          { stat: "ma", value: 3 },
        ],
        description: "+3 IQ, +3 BIQ, +3 MA (alternating pattern)",
      };
    }
    return { skipDefault: true };
  },
  "+3 IQ/BIQ/MA on alternating pattern",
);

registerCombatHandler(
  "gaze_of_abyss_5_loses",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Evaluate tại round MA (round cuối). Thua đúng 5 round trước + thắng MA → +5 điểm
    if ((ctx as any).currentRoundStat !== "ma") return { skipDefault: true };
    // Round MA phải là win (không phải tie)
    if (ctx.roundResults?.["ma"] !== "win") return { skipDefault: true };
    const first5 = ["strength", "speed", "durability", "iq", "biq"];
    const totalLost = first5.filter(
      (s) => ctx.roundResults?.[s] === "lose",
    ).length;
    if (totalLost === 5) {
      return {
        selfPoints: 5,
        description: "Gaze of the Abyss: Thua 5 round đầu + thắng MA → +5 điểm",
      };
    }
    return { skipDefault: true };
  },
  "+5 points if lost first 5 rounds and won MA round",
);

registerCombatHandler(
  "borrowed_time_2_loses",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsLost >= 2) {
      return {
        opponentPoints: 0,
        description: "Opponent gets no point on next round win",
      };
    }
    return { skipDefault: true };
  },
  "Deny opponent point after 2 losses",
);

registerCombatHandler(
  "dominator_2_of_3_loses",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Trigger sau round DUR (round thứ 3) — khi đã có đủ kết quả 3 round đầu
    if ((ctx as any).currentRoundStat !== "dur") return { skipDefault: true };
    const first3 = ["strength", "speed", "durability"];
    const lossesInFirst3 = first3.filter(
      (r) => ctx.roundResults?.[r as StatName] === "lose",
    ).length;
    if (lossesInFirst3 >= 2) {
      return {
        opponentStatMods: STAT_NAMES.map((stat) => ({ stat, value: -1 })),
        description: "-1 all stats to opponent (lost 2+ of first 3)",
      };
    }
    return { skipDefault: true };
  },
  "-1 all stats to opponent if lost 2+ of first 3",
);

registerCombatHandler(
  "healing_factor_per_2_lost",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const bonus = Math.floor(ctx.self.roundsLost / 2);
    if (bonus > 0) {
      return {
        selfStatMods: [{ stat: "durability", value: bonus }],
        description: `Healing Factor: ${ctx.self.roundsLost} round thua → +${bonus} Dura`,
      };
    }
    return { skipDefault: true };
  },
  "+1 Durability per 2 rounds lost after combat",
);

registerCombatHandler(
  "mind_control_iq_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppBaseIQ = ctx.opponent.baseStats.iq;
    if (oppBaseIQ <= 5) {
      return {
        selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
        description: `Mind Control: Đối thủ Base IQ ${oppBaseIQ} ≤ 5 → +1 all stats`,
      };
    }
    return { skipDefault: true };
  },
  "+1 all stats if opponent Base IQ <= 5",
);

registerCombatHandler(
  "bloody_strike_per_round_won",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.roundResults) return { skipDefault: true };
    const wonStats = STAT_NAMES.filter(
      (stat) => ctx.roundResults![stat] === "win",
    );
    if (wonStats.length > 0) {
      return {
        selfStatMods: wonStats.map((stat) => ({ stat, value: 1 })),
        description: `Bloody Strike: Thắng round ${wonStats.join(", ")} → +1 mỗi stat`,
      };
    }
    return { skipDefault: true };
  },
  "+1 to each stat that won a round after combat",
);

registerCombatHandler(
  "memory_alter_disable_in_combat_power",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppPowers: string[] = ctx.opponent.powers || [];
    if (oppPowers.length === 0) {
      return {
        skipDefault: true,
        description: "Memory Alter: Đối thủ không có Power nào",
      };
    }
    const disabled = oppPowers[Math.floor(Math.random() * oppPowers.length)];
    return {
      description: `Memory Alter: Vô hiệu Power "${disabled}" của đối thủ trong combat (nếu thắng thì mất vĩnh viễn)`,
    };
  },
  "Disable 1 random in-combat power of opponent before combat (Memory Alter)",
);

registerCombatHandler(
  "uno_reverse_card_swap_debuffs",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "Uno Reverse Card: Debuff giảm stat từ đối thủ áp dụng lên chính đối thủ; debuff của bản thân áp dụng lên bản thân (engine effect)",
    };
  },
  "Stat debuffs from opponent redirect to themselves; own debuffs redirect to self (Uno Reverse Card)",
);

registerCombatHandler(
  "frost_fingers_per_gear",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const gears: string[] = ctx.opponent.gears || [];
    const penalty = Math.min(gears.length, 5);
    if (penalty === 0) {
      return {
        skipDefault: true,
        description: "Frost Fingers: Đối thủ không có Gear",
      };
    }
    const oppStats = ctx.opponent.stats;
    let highestStat: StatName = "strength";
    let highestVal = oppStats.strength;
    for (const s of STAT_NAMES) {
      if (oppStats[s] > highestVal) {
        highestVal = oppStats[s];
        highestStat = s;
      }
    }
    return {
      opponentStatMods: [{ stat: highestStat, value: -penalty }],
      description: `Frost Fingers: Đối thủ có ${gears.length} Gear → -${penalty} ${highestStat} (tối đa 5)`,
    };
  },
  "-1 opponent highest stat per gear they own (max 5) - Frost Fingers",
);

registerCombatHandler(
  "stat_absorption_opponent_highest",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppStats = ctx.opponent.stats;
    let highestStat: StatName = "strength";
    let highestVal = oppStats.strength;
    for (const s of STAT_NAMES) {
      if (oppStats[s] > highestVal) {
        highestVal = oppStats[s];
        highestStat = s;
      }
    }
    return {
      selfStatMods: [{ stat: highestStat, value: 1 }],
      description: `Stat Absorption: +1 ${highestStat} (stat cao nhất của đối thủ: ${highestVal})`,
    };
  },
  "+1 to stat that opponent has highest after win (Stat Absorption)",
);

registerCombatHandler(
  "luck_manipulation_round_64_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const isFrom64 = ctx.self.pvpWins >= 2;
    if (!isFrom64) {
      return {
        skipDefault: true,
        description: `Luck Manipulation: Chưa đến vòng 64 (pvpWins: ${ctx.self.pvpWins})`,
      };
    }
    return {
      description: `Luck Manipulation: Từ vòng 64 → bonus stats sẽ áp dụng`,
    };
  },
  "From round 64: 15% +1 all stats, 5% +2 all stats (Luck Manipulation)",
);

registerCombatHandler(
  "zoltraak_double_biq_round",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Handler này chỉ dùng để detect — điểm được tính tự nhiên qua computeRoundStep lần 2
    if (ctx.currentRoundStat !== "biq") return { skipDefault: true };
    return { skipDefault: true };
  },
  "BIQ round happens twice, each scored separately (Zoltraak)",
);

const INSTRUMENT_NAMES_EH = [
  "bagpipe",
  "drums",
  "flute",
  "guitar",
  "violin",
  "trumpet",
  "piano",
  "harp",
  "lute",
  "saxophone",
  "bass",
  "cello",
  "harmonica",
  "ukulele",
  "nunchuck",
  "ruan mei",
];

const SOUND_POWERS = [
  "zoltraak",
  "rickrolling",
  "music",
  "sound",
  "melody",
  "siren",
  "bard",
  "singer",
  "singer",
];

registerCombatHandler(
  "enhanced_hearing_instrument_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const weapons: any[] = ctx.opponent.weapons || [];
    const hasInstrument = weapons.some((w) => {
      const wName = (typeof w === "string" ? w : (w?.name ?? "")).toLowerCase();
      return INSTRUMENT_NAMES_EH.some((inst) => wName.includes(inst));
    });
    if (hasInstrument) {
      return {
        selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: -1 })),
        description: "Enhanced Hearing: Đối thủ dùng nhạc cụ → -1 all stats",
      };
    }
    return {
      skipDefault: true,
      description: "Enhanced Hearing: Đối thủ không dùng nhạc cụ",
    };
  },
  "-1 all stats if opponent uses a musical instrument (Enhanced Hearing)",
);

registerCombatHandler(
  "enhanced_hearing_sound_power_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const powers: string[] = (ctx.opponent.powers || []).map((p: any) =>
      (typeof p === "string" ? p : (p?.name ?? "")).toLowerCase(),
    );
    const hasSoundPower = powers.some((p) =>
      SOUND_POWERS.some((sp) => p.includes(sp)),
    );
    if (hasSoundPower) {
      return {
        selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: -2 })),
        description:
          "Enhanced Hearing: Đối thủ có power âm thanh → -2 all stats",
      };
    }
    return {
      skipDefault: true,
      description: "Enhanced Hearing: Đối thủ không có power âm thanh",
    };
  },
  "-2 all stats if opponent has a sound-related power (Enhanced Hearing)",
);

registerCombatHandler(
  "spear_of_fire_2_rune_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const oppWeapons: any[] = (ctx.opponent?.character as any)?.weapons || [];
    const hasUsableWeapon = oppWeapons.some(
      (w: any) =>
        !w.isLost &&
        !(typeof w === "string" ? w : (w?.name ?? ""))
          .toLowerCase()
          .includes("không dùng được"),
    );
    const oppRunes: any[] =
      (ctx.opponent?.character as any)?.runes?.runes || [];
    const activeRuneCount = oppRunes.filter((r: any) => !r.isLost).length;
    if (hasUsableWeapon && activeRuneCount >= 2) {
      return {
        selfPoints: 1,
        description: `Spear of Fire: Đối thủ có vũ khí dùng được + ${activeRuneCount} Rune → +1 điểm khởi đầu`,
      };
    }
    const reason = !hasUsableWeapon
      ? "Đối thủ không có vũ khí dùng được"
      : `Đối thủ chỉ có ${activeRuneCount} Rune (cần ≥2)`;
    return {
      skipDefault: true,
      description: `Spear of Fire: ${reason} → không kích hoạt`,
    };
  },
  "+1 starting point if opponent has usable weapon and 2+ active runes (Spear of Fire)",
);

registerCombatHandler(
  "bucking_bronco_ma_round_win",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.ma === "win") {
      return {
        selfStatMods: [{ stat: "ma", value: 1 }],
        description: "Bucking Bronco: Thắng round MA → +1 MA (stackable)",
      };
    }
    return {
      skipDefault: true,
      description: "Bucking Bronco: Không thắng round MA → không nhận bonus",
    };
  },
  "After combat win: +1 MA (stackable) only if also won MA round (Bucking Bronco)",
);

registerCombatHandler(
  "lone_wolf_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppPowers: any[] = ctx.opponent.powers || [];
    const oppHasLoneWolf = oppPowers.some((p: any) => {
      const n = typeof p === "string" ? p : (p?.name ?? "");
      return n.toLowerCase().includes("lone wolf");
    });
    if (oppHasLoneWolf) {
      return {
        removePower: "Lone Wolf",
        description: "Lone Wolf: Cả hai đều có power này → mất power Lone Wolf",
      };
    }
    return {
      skipDefault: true,
      description: "Lone Wolf: Đối thủ không có Lone Wolf → +3 Speed vẫn còn",
    };
  },
  "After combat: if opponent also has Lone Wolf, both lose the power (Lone Wolf)",
);

registerCombatHandler(
  "odin_blessing_convert_to_highest",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    let highestStat: StatName = "strength";
    let highestVal = ctx.self.stats.strength;
    for (const s of STAT_NAMES) {
      if (ctx.self.stats[s] > highestVal) {
        highestVal = ctx.self.stats[s];
        highestStat = s;
      }
    }
    if (highestStat === "strength") {
      return {
        skipDefault: true,
        description:
          "Odin Blessing: Stat cao nhất là Strength → +2 STR như bình thường",
      };
    }
    return {
      selfStatMods: [
        { stat: "strength", value: -2 },
        { stat: highestStat, value: 2 },
      ],
      description: `Odin Blessing: Sau thua → chuyển +2 STR thành +2 ${highestStat} (stat cao nhất)`,
    };
  },
  "After combat loss: convert +2 STR bonus to +2 highest stat (Odin Blessing)",
);

registerCombatHandler(
  "fancy_feet_disable_rune",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppRunes = (ctx.opponent.character as any)?.rune?.runes || [];
    const oppRuneword = (ctx.opponent.character as any)?.rune?.runeword;
    if (oppRunes.length === 0 && !oppRuneword) {
      return {
        skipDefault: true,
        description: "Fancy Feet: Đối thủ không có Rune/Runeword",
      };
    }
    const runeDesc =
      oppRuneword || oppRunes.map((r: any) => r?.name ?? r).join(", ");
    return {
      description: `Fancy Feet: Vô hiệu Rune/Runeword của đối thủ (${runeDesc}) trước combat`,
    };
  },
  "Before combat: disable opponent rune/runeword (Fancy Feet)",
);

registerCombatHandler(
  "guidance_fewer_powers_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const selfPowerCount = ctx.self.powers.length;
    const oppPowerCount = (ctx.opponent.powers || []).length;
    if (selfPowerCount <= oppPowerCount) {
      return {
        skipDefault: true,
        description: `Guidance: Đối thủ không ít power hơn (${oppPowerCount} vs ${selfPowerCount}) → không áp dụng`,
      };
    }
    const shuffled = [...STAT_NAMES].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, 2);
    return {
      selfStatMods: chosen.map((stat) => ({ stat, value: 1 })),
      description: `Guidance: Đối thủ ít power hơn (${oppPowerCount} < ${selfPowerCount}) → +1 ${chosen.join(", ")}`,
    };
  },
  "+1 to 2 random stats if opponent has fewer powers (Guidance)",
);

registerCombatHandler(
  "garlic_breath_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppIsVampire = ctx.opponent.race.toLowerCase() === "vampire";
    const breathPowers = ctx.self.powers.filter((p) =>
      p.toLowerCase().includes("breath"),
    ).length;
    if (!oppIsVampire && breathPowers < 3) {
      return {
        skipDefault: true,
        description: `Garlic Breath: đối thủ không phải Vampire (${ctx.opponent.race}), chỉ có ${breathPowers} Breath power`,
      };
    }
    const reason = oppIsVampire
      ? "đối thủ là Vampire"
      : `có ${breathPowers} Breath power`;
    return {
      selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
      description: `+1 All Stats (Garlic Breath – ${reason})`,
    };
  },
  "+1 all stats vs Vampire or with 3+ Breath powers (Garlic Breath)",
);

registerCombatHandler(
  "super_lucky_comeback_check",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    if (Math.random() < 0.15) {
      return { autoWin: true, description: "LẬT KÈO! (Super Lucky – 15%)" };
    }
    if (Math.random() < 0.1) {
      return {
        autoWin: true,
        description: "LẬT KÈO! (Super Lucky – 10% lần 2)",
      };
    }
    return {
      skipDefault: true,
      description: "Super Lucky: không lật kèo được (cả 15% lẫn 10% đều trượt)",
    };
  },
  "15% then 10% auto-win comeback when losing (Super Lucky)",
);

registerCombatHandler(
  "four_hit_combo_biq_equalize",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const biqResult = ctx.roundResults?.biq ?? ctx.roundResults?.["biq"];
    if (biqResult !== "win")
      return {
        skipDefault: true,
        description: "4 Hit Combo: Không thắng round BIQ → không kích hoạt",
      };
    // Tính score chỉ đến hết round BIQ (5 round đầu, không tính MA)
    const PRE_BIQ_STATS = ["str", "spd", "dur", "iq", "biq"];
    const rr = ctx.roundResults ?? {};
    let selfScore = 0;
    let oppScore = 0;
    for (const stat of PRE_BIQ_STATS) {
      const result =
        rr[stat] ??
        rr[
          {
            str: "strength",
            spd: "speed",
            dur: "durability",
            iq: "iq",
            biq: "biq",
          }[stat] ?? stat
        ];
      if (result === "win") selfScore++;
      else if (result === "lose") oppScore++;
    }
    if (selfScore >= oppScore) {
      return {
        skipDefault: true,
        description: `4 Hit Combo: Thắng BIQ nhưng đang không thua điểm đến round BIQ (${selfScore} vs ${oppScore}) → không kích hoạt`,
      };
    }
    const diff = oppScore - selfScore;
    return {
      selfPoints: diff,
      description: `4 Hit Combo: Thắng round BIQ → +${diff} điểm để bằng đối thủ tính đến round BIQ (${selfScore} → ${oppScore})`,
    };
  },
  "BIQ win: equalize own score to opponent score if behind (4 Hit Combo)",
);

registerCombatHandler(
  "golden_parry_deny_opponent_point",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.currentRoundResult !== "lose") return { skipDefault: true };
    if (Math.random() > 0.35) {
      return {
        skipDefault: true,
        description: "Golden Parry: không kích hoạt (65%)",
      };
    }
    return {
      blockOpponentPoint: true,
      description:
        "Đối thủ không nhận điểm round này (Golden Parry – 35% khi thua round)",
    };
  },
  "35% opponent does not score when you lose a round (Golden Parry)",
);

registerCombatHandler(
  "eternal_mangekyou_random_effect",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const options: Array<{ stat: StatName; name: string }> = [
      { stat: "durability", name: "Amaterasu (-6 Dura)" },
      { stat: "iq", name: "Tsukuyomi (-6 IQ)" },
      { stat: "strength", name: "Susanoo (-6 Strength)" },
    ];
    const chosen = options[Math.floor(Math.random() * 3)];
    return {
      opponentStatMods: [{ stat: chosen.stat, value: -6 }],
      description: `Eternal Mangekyou Sharingan: ${chosen.name} đối thủ`,
    };
  },
  "Random -6 to opponent: Amaterasu(Dura) / Tsukuyomi(IQ) / Susanoo(Str)",
);

registerCombatHandler(
  "spell_flux_double_first_in_combat",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        '[Spell Flux] Power "Trong combat" đầu tiên kích hoạt 2 lần – GM kiểm tra danh sách power',
      skipDefault: false,
    };
  },
  "First during-combat power activates twice (Spell Flux)",
);

registerCombatHandler(
  "glory_man_united_epl_check",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "[GM Action] Glory glory Man United: Nhập tỉ số MU - Đối thủ. Bàn thua = -1 all stats/bàn; MU thắng ≥3-0 = +7 all stats",
      skipDefault: false,
    };
  },
  "GM enters MU EPL score to calculate stat buff/debuff (Glory glory Man United)",
);

registerCombatHandler(
  "cinder_flickering_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppPowers: any[] = ctx.opponent.powers || [];
    const oppHasCinder = oppPowers.some((p: any) => {
      const n = typeof p === "string" ? p : (p?.name ?? "");
      return n.toLowerCase().includes("cinder flickering");
    });
    if (oppHasCinder) {
      return {
        grantCreatorFavor: 0,
        description:
          '[Cinder Flickering] Cả 2 đều có power → Người thắng nhận Char Dev "Lord of Cinder" (GM xử lý)',
      };
    }
    return {
      skipDefault: true,
      description: "Cinder Flickering: Đối thủ không có power này",
    };
  },
  'After combat: winner gets "Lord of Cinder" char dev if both have Cinder Flickering',
);

registerCombatHandler(
  "darwin_evolution_race_up",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "[Darwin Evolution Theory] Sau combat: Thăng hạng chủng tộc +1 bậc (GM xử lý nâng race tier)",
      skipDefault: false,
    };
  },
  "After combat: race tier upgrades by 1 (Darwin Evolution Theory)",
);

registerCombatHandler(
  "algorithms_are_clear_replace_lowest",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppBase = ctx.opponent.baseStats;
    const STAT_KEYS: StatName[] = [
      "strength",
      "speed",
      "durability",
      "iq",
      "biq",
      "ma",
    ];
    const totalOppBase = STAT_KEYS.reduce(
      (sum, s) => sum + (oppBase[s] || 0),
      0,
    );
    const avgOppBase = Math.round(totalOppBase / 6);
    const selfStats = ctx.self.stats;
    let lowestStat: StatName = "strength";
    let lowestVal = selfStats.strength;
    for (const s of STAT_KEYS) {
      if (selfStats[s] < lowestVal) {
        lowestVal = selfStats[s];
        lowestStat = s;
      }
    }
    const diff = avgOppBase - lowestVal;
    if (diff === 0) {
      return {
        skipDefault: true,
        description: `Algorithms Are Clear: ${lowestStat} đã bằng avg đối thủ (${avgOppBase})`,
      };
    }
    return {
      selfStatMods: [{ stat: lowestStat, value: diff }],
      description: `Algorithms Are Clear: Tổng base đối thủ ${totalOppBase}/6 = ${avgOppBase} → thay ${lowestStat} (${lowestVal} → ${avgOppBase})`,
    };
  },
  "After combat: replace own lowest base stat with avg of opponent base stats (Algorithms Are Clear)",
);

registerCombatHandler(
  "adapt_disable_known_powers",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const knownPowers: string[] =
      (ctx.self.character as any)?.adaptKnownPowers || [];
    if (knownPowers.length === 0) {
      return {
        skipDefault: true,
        description:
          "Adapt: Chưa có Power nào được ghi nhớ — không vô hiệu hóa được Power nào",
      };
    }
    return {
      description: `[Adapt] Vô hiệu hóa các Power đối thủ đã gặp trong quá khứ: ${knownPowers.join(", ")}`,
      skipDefault: false,
    };
  },
  "Before combat: disable opponent powers that were previously encountered (Adapt)",
);

registerCombatHandler(
  "cold_mirage_spin_unused_round",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const STAT_KEYS: StatName[] = [
      "strength",
      "speed",
      "durability",
      "iq",
      "biq",
      "ma",
    ];
    const playedRounds = Object.keys(ctx.roundResults || {});
    const unusedRounds = STAT_KEYS.filter((s) => !playedRounds.includes(s));
    if (unusedRounds.length === 0) {
      return {
        skipDefault: true,
        description: "Cold Mirage: Không còn round chưa thi đấu",
      };
    }
    const picked =
      unusedRounds[Math.floor(Math.random() * unusedRounds.length)];
    return {
      description: `[Cold Mirage] Round ${picked} bị quay → Đối thủ không nhận điểm nếu thắng round ${picked} (GM xử lý cancel điểm)`,
      skipDefault: false,
    };
  },
  "After round win: spin unused round — opponent scores no point if winning that round (Cold Mirage)",
);

// ============================================================================
// DEFINITIONS
// ============================================================================

export function registerAllPowerEffects() {
  // U=ma2 (từ Agnes Tachyon)
  defineEffect("power", "U=ma2")
    .description(
      "Trong combat: Thua round Str: +3 Speed. Thua round Speed: +4 Dura.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: 3,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "uma2_str_lose",
    })
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 4,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "uma2_spd_lose",
    })
    .register();

  defineEffect("power", "Memory Freeze")
    .description('Sau combat thua: Đối thủ nhận Quirk "Brainrot".')
    .weight(0.78)
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "Brainrot",
      grantCount: 1,
      timing: "after_combat_lose",
      target: "opponent",
    })
    .register();

  defineEffect("power", "Metamagic")
    .description("Trong Combat: +1 Điểm ở Round BIQ nếu thắng.")
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "metamagic_biq_round",
    })
    .register();

  defineEffect("power", "Baldening")
    .description("Debuff: Khiến đối thủ bị rụng hết tóc.")
    .weight(0.78)
    .register();

  defineEffect("power", "Critical Strike")
    .description("Trong Combat: 20% nhận thêm 1 điểm mỗi round thắng.")
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 1,
      timing: "on_round_win",
      target: "self",
      conditions: [{ type: "probability", chance: 20 }],
    })
    .register();

  defineEffect("power", "Evasion")
    .description("Trong Combat: 20% nhận 1 điểm mỗi round thua.")
    .weight(0.78)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "on_round_lose",
      target: "self",
      conditions: [{ type: "probability", chance: 20 }],
    })
    .register();

  defineEffect("power", "Healing Factor")
    .description("Buff: +1 Dura. Sau combat: +1 Dura với mỗi 2 round thua.")
    .weight(0.78)
    .addStat("durability", 1)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 1,
      timing: "after_combat",
      target: "self",
      customHandler: "healing_factor_per_2_lost",
    })
    .register();

  defineEffect("power", "Gourmand")
    .description("Buff: +4 Durability.")
    .weight(0.78)
    .addStat("durability", 4)
    .register();

  defineEffect("power", "Lone Wolf")
    .description("+3 Speed. Gặp người cũng có power này: mất power.")
    .weight(0.78)
    .addStat("speed", 3)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "lone_wolf_check",
    })
    .register();

  defineEffect("power", "AIDS")
    .description("Sau Combat: -2 Dura. Lây sang Lover. Không thể xóa bỏ.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: -2,
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "immediate",
      target: "lover",
      customHandler: "aids_spread_to_lover",
    })
    .effect({
      type: "immunity",
      immuneTo: ["remove_aids"],
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("power", "Petrification")
    .description("Debuff: Đối thủ -4 Speed.")
    .weight(0.78)
    .debuffOpponent("speed", 4)
    .register();

  defineEffect("power", "Magma Strike")
    .description("Debuff: -2 Dura đối thủ. Sau combat: -1 Dura đối thủ.")
    .weight(0.78)
    .debuffOpponent("durability", 2)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: -1,
      timing: "after_combat",
      target: "opponent",
    })
    .register();

  defineEffect("power", "Ice Hammer")
    .description("Buff: +2 Strength. Debuff: -2 Speed đối thủ.")
    .weight(0.78)
    .addStat("strength", 2)
    .debuffOpponent("speed", 2)
    .register();

  defineEffect("power", "Storm Calling")
    .description("Trước Combat: +2 BIQ.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 2,
      timing: "before_combat",
      target: "self",
    })
    .register();

  defineEffect("power", "Spear of Fire")
    .description("Buff: +2 MA. Nếu đối thủ có vũ khí dùng được và ≥2 Rune: +1 điểm khởi đầu.")
    .weight(0.78)
    .addStat("ma", 2)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
      customHandler: "spear_of_fire_2_rune_check",
    })
    .register();

  defineEffect("power", "Bonk Bonk Bonk")
    .description(
      "Debuff: -2 Str/Spd/Dura đối thủ. Nếu Gigachad: thêm -2 IQ/BIQ/MA.",
    )
    .weight(0.78)
    .debuffOpponent("strength", 2)
    .debuffOpponent("speed", 2)
    .debuffOpponent("durability", 2)
    .effect({
      type: "debuff",
      stat: "iq",
      value: -2,
      timing: "before_combat",
      target: "opponent",
      conditions: [
        {
          type: "has_item",
          itemType: "archetype",
          itemName: "Gigachad",
          checkTarget: "self",
        },
      ],
    })
    .effect({
      type: "debuff",
      stat: "biq",
      value: -2,
      timing: "before_combat",
      target: "opponent",
      conditions: [
        {
          type: "has_item",
          itemType: "archetype",
          itemName: "Gigachad",
          checkTarget: "self",
        },
      ],
    })
    .effect({
      type: "debuff",
      stat: "ma",
      value: -2,
      timing: "before_combat",
      target: "opponent",
      conditions: [
        {
          type: "has_item",
          itemType: "archetype",
          itemName: "Gigachad",
          checkTarget: "self",
        },
      ],
    })
    .register();

  defineEffect("power", "Invulnerability")
    .description("+2 Durability.")
    .weight(0.78)
    .addStat("durability", 2)
    .register();

  defineEffect("power", "Overdrive")
    .description("+3 MA, -1 Durability.")
    .weight(0.78)
    .addStat("ma", 3)
    .addStat("durability", -1)
    .register();

  defineEffect("power", "Drunken Boxing")
    .description("-1 IQ, -1 Speed, +4 MA.")
    .weight(0.78)
    .addStat("iq", -1)
    .addStat("speed", -1)
    .addStat("ma", 4)
    .register();

  defineEffect("power", "Divine Lightning")
    .description("+1 Str/Spd/MA. Buff: +1 Str/Spd/MA vs Demon.")
    .weight(0.78)
    .addStat("strength", 1)
    .addStat("speed", 1)
    .addStat("ma", 1)
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Demon"] }],
    })
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Demon"] }],
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Demon"] }],
    })
    .register();

  defineEffect("power", "Fist Fighting")
    .description("Mất vũ khí. +4 MA.")
    .weight(0.78)
    .effect({
      type: "remove_gear",
      timing: "immediate",
      target: "self",
      customHandler: "fist_fighting_remove_weapon",
    })
    .addStat("ma", 4)
    .register();

  defineEffect("power", "Rampage")
    .description("Sau combat thắng: 36% +1 all stats.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "after_combat_win",
      target: "self",
      conditions: [{ type: "probability", chance: 36 }],
    })
    .register();

  defineEffect("power", "Bloodlust")
    .description("Sau combat thắng: -1 IQ/MA, +1 Str/Spd, +2 Dura.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: -1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: -1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: 1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 2,
      timing: "after_combat_win",
      target: "self",
    })
    .register();

  defineEffect("power", "Power Absorption")
    .description("Sau combat thắng: hấp thụ 1 Power ngẫu nhiên của đối thủ.")
    .weight(0.78)
    .effect({
      type: "steal_power",
      grantCount: 1,
      timing: "after_combat_win",
      target: "opponent",
    })
    .register();

  defineEffect("power", "Power Negation")
    .description("Trước Combat: Vô hiệu hóa 1 Power ngẫu nhiên của đối thủ.")
    .weight(0.78)
    .effect({
      type: "power_disable",
      timing: "before_combat",
      target: "opponent",
      grantCount: 1,
    })
    .register();

  defineEffect("power", "Mind Control")
    .description("Trước Combat: +1 all stats vs đối thủ có Base IQ ≤5.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "before_combat",
      target: "self",
      conditions: [
        {
          type: "stat_compare",
          stat: "iq",
          compareWith: "opponent",
          operator: "<=",
        },
      ],
      customHandler: "mind_control_iq_check",
    })
    .register();

  defineEffect("power", "Blood Manipulation")
    .description("Trước Combat: +3 Strength vs tất cả trừ Skeleton và Spirit.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 3,
      timing: "before_combat",
      target: "self",
      conditions: [
        { type: "race_match", excludeRaces: ["Skeleton", "Spirit"] },
      ],
    })
    .register();

  defineEffect("power", "Sonic Scream")
    .description("Debuff: -3 Durability đối thủ.")
    .weight(0.78)
    .debuffOpponent("durability", 3)
    .register();

  defineEffect("power", "Thunder Orb")
    .description("Debuff: -2 Durability đối thủ.")
    .weight(0.78)
    .debuffOpponent("durability", 2)
    .register();

  defineEffect("power", "Armor Piercing")
    .description("Trong Combat: +1 Điểm ở Round Dura nếu thắng.")
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "armor_piercing_dura_round",
    })
    .register();

  defineEffect("power", "Divine Smite")
    .description("Trong Combat: +1 Điểm ở Round MA nếu thắng.")
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "divine_smite_ma_round",
    })
    .register();

  defineEffect("power", "Quas")
    .description(
      "Buff: +1 Strength. Có Quas+Wex+Exort: nhận Archetype Invoker.",
    )
    .weight(0.78)
    .addStat("strength", 1)
    .effect({
      type: "grant_archetype",
      grantName: "Invoker",
      grantCount: 1,
      timing: "immediate",
      target: "self",
      triggerOnce: true,
      customHandler: "quas_wex_exort_check",
    })
    .register();

  defineEffect("power", "Wex")
    .description("Buff: +1 Speed. Có Quas+Wex+Exort: nhận Archetype Invoker.")
    .weight(0.78)
    .addStat("speed", 1)
    .effect({
      type: "grant_archetype",
      grantName: "Invoker",
      grantCount: 1,
      timing: "immediate",
      target: "self",
      triggerOnce: true,
      customHandler: "quas_wex_exort_check",
    })
    .register();

  defineEffect("power", "Exort")
    .description("Buff: +1 IQ. Có Quas+Wex+Exort: nhận Archetype Invoker.")
    .weight(0.78)
    .addStat("iq", 1)
    .effect({
      type: "grant_archetype",
      grantName: "Invoker",
      grantCount: 1,
      timing: "immediate",
      target: "self",
      triggerOnce: true,
      customHandler: "quas_wex_exort_check",
    })
    .register();

  defineEffect("power", "Enlarging")
    .description("+3 Str, +3 Dura, -6 Speed.")
    .weight(0.78)
    .addStat("strength", 3)
    .addStat("durability", 3)
    .addStat("speed", -6)
    .register();

  defineEffect("power", "Shrinking")
    .description("+6 Speed, -3 Str, -3 Dura.")
    .weight(0.78)
    .addStat("speed", 6)
    .addStat("strength", -3)
    .addStat("durability", -3)
    .register();

  defineEffect("power", "Bloody Strike")
    .description("-1 all stats. Sau combat: +1 vào mỗi stat thắng round.")
    .weight(0.78)
    .addAllStats(-1)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 1,
      timing: "after_combat",
      target: "self",
      customHandler: "bloody_strike_per_round_won",
    })
    .register();

  defineEffect("power", "Accelerating Sorcery")
    .description('Trong Combat: +1 IQ mỗi khi kích hoạt Power "Trong combat".')
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "accelerating_sorcery_count",
    })
    .register();

  defineEffect("power", "Homeguard")
    .description("Trong Combat: Buff +3 Speed nếu không thua round Strength.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: 3,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "homeguard_no_str_lose",
    })
    .register();

  defineEffect("power", "Bash")
    .description(
      "Trong combat: Sau mỗi round thắng, 35% đối thủ -3 stat round kế.",
    )
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "random",
      value: -3,
      timing: "on_round_win",
      target: "opponent",
      conditions: [{ type: "probability", chance: 35 }],
    })
    .register();

  defineEffect("power", "Gate to Heaven")
    .description("Khi ở nhánh thắng từ Vòng 32: +1 all stats.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "immediate",
      target: "self",
      customHandler: "gate_to_heaven_round_check",
    })
    .register();

  defineEffect("power", "Weapon Enhancing")
    .description("+1 vào mỗi buff từ vũ khí, -1 vào mỗi debuff từ vũ khí.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "weapon_enhancing_modify",
    })
    .register();

  defineEffect("power", "Fancy Feet")
    .description("-1 Dura. Trước combat: Vô hiệu vũ khí và Rune đối phương.")
    .weight(0.78)
    .addStat("durability", -1)
    .effect({
      type: "weapon_disable",
      timing: "before_combat",
      target: "opponent",
    })
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "opponent",
      customHandler: "fancy_feet_disable_rune",
    })
    .register();

  defineEffect("power", "Artist")
    .description(
      "Khi xuống nhánh thua: Stat lẻ của bạn nhận +1. (Dựa theo Base Stats)",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "odd",
      value: 1,
      timing: "on_loser_bracket",
      target: "self",
    })
    .register();

  defineEffect("power", "Writer")
    .description(
      "Khi xuống nhánh thua: Stat chẵn của bạn nhận +1. (Dựa theo Base Stats)",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "even",
      value: 1,
      timing: "on_loser_bracket",
      target: "self",
    })
    .register();

  defineEffect("power", "Red Shift/LP1211-M")
    .description(
      "Trong combat: Nếu thắng ít nhất 1/3 round đầu, Buff: +1 IQ, +1 BIQ, +2 MA.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "red_shift_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "red_shift_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 2,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "red_shift_check",
    })
    .register();

  defineEffect("power", "Shooting for Victory")
    .description(
      "Trong combat: Nếu thắng ít nhất 1 và thua ít nhất 1/3 round đầu, Buff: +1 IQ, +1 BIQ, +2 MA.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "shooting_for_victory_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "shooting_for_victory_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 2,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "shooting_for_victory_check",
    })
    .register();

  defineEffect("power", "Let's Pump Some Iron!")
    .description(
      "Trong combat: Nếu thắng đúng 1/3 round đầu, Buff: +2 IQ, +2 BIQ, +2 MA.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 2,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "pump_iron_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 2,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "pump_iron_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 2,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "pump_iron_check",
    })
    .register();

  defineEffect("power", "Hunter's Rewards")
    .description("Sau Combat: Thắng PvP nhận 2 phần thưởng thay vì 1.")
    .weight(0.78)
    .effect({
      type: "double_reward",
      timing: "after_combat_win",
      target: "self",
    })
    .register();

  defineEffect("power", "Quirkful")
    .description(
      "Nhận thêm 1 Power với mỗi Quirk bạn có khi quay ra Power này.",
    )
    .weight(0.78)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      timing: "immediate",
      target: "self",
      triggerOnce: true,
      customHandler: "quirkful_grant_per_quirk",
    })
    .register();

  defineEffect("power", "Quirkless")
    .description("Mất hết tất cả Quirk.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "quirkless_remove_all_quirks",
    })
    .register();

  defineEffect("power", "Sybaurafarming")
    .description("Base Stat >5 thành 5. Mỗi stat bị đổi nhận 1 Quirk.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      triggerOnce: true,
      customHandler: "sybaurafarming_effect",
    })
    .register();

  defineEffect("power", "Swinging Maestro")
    .description("Buff: Nhận 4 Durability.")
    .weight(0.78)
    .addStat("durability", 4)
    .register();

  defineEffect("power", "The Coast is Clear!")
    .description("Bạn nhìn rõ đối thủ!")
    .weight(0.78)
    .register();

  defineEffect("power", "Angling and Scheming")
    .description(
      "Trong Combat: Nếu thắng Round Strength, Buff: +1 IQ, +1 BIQ, +2 MA.",
    )
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "angling_scheming_str_win",
    })
    .register();

  defineEffect("power", "EscAPADe")
    .description("Chuyển hoá tất cả IQ cộng thêm thành Strength.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "escapade_convert_iq_to_str",
    })
    .register();

  defineEffect("power", "Spirit Link")
    .description("Nhận +1 vào 1 Stat ngẫu nhiên với mỗi 1 người bạn loại.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 1,
      timing: "after_combat_win",
      target: "self",
      stackable: true,
    })
    .register();

  defineEffect("power", "The Sand of Time")
    .description(
      "Trong Combat: Lần đầu thua round, 40% +1 điểm bạn và -1 điểm đối thủ.",
    )
    .weight(0.78)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "on_round_lose",
      target: "self",
      triggerOnce: true,
      conditions: [{ type: "probability", chance: 40 }],
    })
    .effect({
      type: "combat_points",
      points: -1,
      timing: "on_round_lose",
      target: "opponent",
      triggerOnce: true,
      conditions: [{ type: "probability", chance: 40 }],
    })
    .register();

  defineEffect("power", "Memory Alter")
    .description(
      'Trước Combat: Vô hiệu 1 Power "trong combat" đối thủ. Thắng thì đối thủ mất vĩnh viễn.',
    )
    .weight(0.78)
    .effect({
      type: "power_disable",
      timing: "before_combat",
      target: "opponent",
      grantCount: 1,
      customHandler: "memory_alter_disable_in_combat_power",
    })
    .register();

  defineEffect("power", "Frost Fingers")
    .description(
      "Debuff: Mỗi Gear đối thủ có, -1 Stat cao nhất đối thủ (tối đa 5).",
    )
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "highest",
      value: -1,
      timing: "before_combat",
      target: "opponent",
      customHandler: "frost_fingers_per_gear",
    })
    .register();

  defineEffect("power", "Gaze of the Abyss")
    .description("Trong Combat: Thua 5 Round, round tiếp theo thắng +5 Điểm.")
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 5,
      timing: "during_combat",
      target: "self",
      customHandler: "gaze_of_abyss_5_loses",
    })
    .register();

  defineEffect("power", "Railroad Realm 🍀")
    .description("Trong Combat: Bạn và đối thủ nghe tiếng xình xịch của tàu 🍀")
    .weight(0.78)
    .register();

  defineEffect("power", "Mewing")
    .description("Bye bye 🤫🧏‍♂.")
    .weight(0.78)
    .register();

  defineEffect("power", "Master of War")
    .description("Ngay lập tức khi nhận, bạn dùng được tất cả Weapon.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "master_of_war_unlock_all_weapons",
    })
    .register();

  defineEffect("power", "Borrowed Time")
    .description(
      "Trong Combat: Thua 2 round, round tiếp theo đối thủ không nhận điểm nếu bạn thua.",
    )
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      triggerOnce: true,
      customHandler: "borrowed_time_2_loses",
    })
    .register();

  defineEffect("power", "Guidance")
    .description(
      "Trước Combat: +1 vào 2 Stat ngẫu nhiên nếu đối thủ có ít power hơn.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 1,
      timing: "before_combat",
      target: "self",
      customHandler: "guidance_fewer_powers_check",
    })
    .register();

  defineEffect("power", "Hunter's Mark")
    .description(
      "Trước Combat: Chọn 1 Round ngẫu nhiên, thắng round đó +1 điểm.",
    )
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "hunters_mark_random_round",
    })
    .register();

  defineEffect("power", "Ice Liquefactors")
    .description("Hóa lỏng băng 💀???")
    .weight(0.78)
    .register();

  defineEffect("power", "Fire Control")
    .description("Điều khiển được một ngọn lửa bật hoặc tắt 💀")
    .weight(0.78)
    .register();

  defineEffect("power", "Water Breathing")
    .description("Thở dưới nước.")
    .weight(0.78)
    .register();

  defineEffect("power", "Cursed")
    .description("Re-spin lại chỉ số cao nhất 1 lần.")
    .weight(0.78)
    .effect({
      type: "stat_respin",
      stat: "highest",
      timing: "immediate",
      target: "self",
      triggerOnce: true,
    })
    .register();

  defineEffect("power", "Enhanced Hearing")
    .description(
      "+2 MA. Trước Combat: -1 all nếu đối thủ dùng nhạc cụ, -2 all nếu đối thủ có power âm thanh.",
    )
    .weight(0.78)
    .addStat("ma", 2)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "before_combat",
      target: "self",
      customHandler: "enhanced_hearing_instrument_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -2,
      timing: "before_combat",
      target: "self",
      customHandler: "enhanced_hearing_sound_power_check",
    })
    .register();

  defineEffect("power", "Rickrolling")
    .description("Chắc không cần giải thích đâu nhỉ 💀")
    .weight(0.78)
    .register();

  defineEffect("power", "Hand Washing")
    .description("Tay sạch 💀")
    .weight(0.78)
    .register();

  defineEffect("power", "67")
    .description("Trong Combat: Chạy Clip 67 cho cả 2 người chơi.")
    .weight(0.78)
    .register();

  defineEffect("power", "Age Manipulation")
    .description("Debuff: Đối thủ +1 IQ, -1 mọi stat còn lại.")
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "iq",
      value: 1,
      timing: "before_combat",
      target: "opponent",
    })
    .effect({
      type: "debuff",
      stat: "strength",
      value: -1,
      timing: "before_combat",
      target: "opponent",
    })
    .effect({
      type: "debuff",
      stat: "speed",
      value: -1,
      timing: "before_combat",
      target: "opponent",
    })
    .effect({
      type: "debuff",
      stat: "durability",
      value: -1,
      timing: "before_combat",
      target: "opponent",
    })
    .effect({
      type: "debuff",
      stat: "biq",
      value: -1,
      timing: "before_combat",
      target: "opponent",
    })
    .effect({
      type: "debuff",
      stat: "ma",
      value: -1,
      timing: "before_combat",
      target: "opponent",
    })
    .register();

  defineEffect("power", "Garlic Breath")
    .description(
      'Buff: +1 all stats vs Vampire. Có 3+ Power "Breath" thì bỏ qua điều kiện.',
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "garlic_breath_check",
    })
    .register();

  defineEffect("power", "The Goat")
    .description("Bạn là dê! 💀")
    .weight(0.78)
    .register();

  defineEffect("power", "Body Enhancing")
    .description("Nhận +1 Strength, +1 Speed, +1 Durability.")
    .weight(0.78)
    .addStat("strength", 1)
    .addStat("speed", 1)
    .addStat("durability", 1)
    .register();

  defineEffect("power", "Clear Mind")
    .description("Nhận +3 IQ.")
    .weight(0.78)
    .addStat("iq", 3)
    .register();

  defineEffect("power", "Force Field")
    .description("Debuff: Đối thủ nhận -2 Speed, -1 MA.")
    .weight(0.78)
    .debuffOpponent("speed", 2)
    .debuffOpponent("ma", 1)
    .register();

  defineEffect("power", "Anti-Magic Barrier")
    .description(
      "-1 Durability. Trước Combat: Vô hiệu 2 Power ngẫu nhiên đối thủ.",
    )
    .weight(0.78)
    .addStat("durability", -1)
    .effect({
      type: "disable_powers",
      count: 2,
      timing: "before_combat",
      target: "opponent",
    })
    .register();

  defineEffect("power", "Black Magic")
    .description("Debuff: Đối thủ -2 vào một stat ngẫu nhiên.")
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "random",
      value: -2,
      timing: "before_combat",
      target: "opponent",
    })
    .register();

  defineEffect("power", "The Great Storm")
    .description("Debuff: -2 Durability đối thủ.")
    .weight(0.78)
    .debuffOpponent("durability", 2)
    .register();

  defineEffect("power", "Continental Super Storm")
    .description("Buff: Nhận +2 Speed.")
    .weight(0.78)
    .addStat("speed", 2)
    .register();

  defineEffect("power", "Sacred Fire")
    .description("Buff: +1 all stats vs Vampire hoặc Demon.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Vampire", "Demon"] }],
    })
    .register();

  defineEffect("power", "Capybara")
    .description("Capybara")
    .weight(0.78)
    .register();

  defineEffect("power", "Tsunami Control")
    .description("Buff: Nhận +2 Strength.")
    .weight(0.78)
    .addStat("strength", 2)
    .register();

  defineEffect("power", "Rising tide")
    .description("Buff: Nhận +2 MA.")
    .weight(0.78)
    .addStat("ma", 2)
    .register();

  defineEffect("power", "Seismic")
    .description("Debuff: Đối thủ -2 MA.")
    .weight(0.78)
    .debuffOpponent("ma", 2)
    .register();

  defineEffect("power", "Night Vision")
    .description("Có thể nhìn trong bóng tối. 💀")
    .weight(0.78)
    .register();

  defineEffect("power", "Gotta go Fast")
    .description("Bạn là Sonic 💀")
    .weight(0.78)
    .register();

  defineEffect("power", "Fair Duel")
    .description("Trước Combat: Cả 2 miễn nhiễm Debuff từ nhau.")
    .weight(0.78)
    .effect({
      type: "immunity",
      immuneTo: ["debuff"],
      timing: "before_combat",
      target: "both",
    })
    .register();

  defineEffect("power", "Uno Reverse Card")
    .description(
      "Trước Combat: Debuff giảm stat từ đối thủ áp dụng lên chính hắn và ngược lại.",
    )
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "self",
      customHandler: "uno_reverse_card_swap_debuffs",
    })
    .register();

  defineEffect("power", "Burning Hand")
    .description("Nhận +1 Strength.")
    .weight(0.78)
    .addStat("strength", 1)
    .register();

  defineEffect("power", "Tick-tock")
    .description("Trong Combat: Cơ thể bạn phát ra tiếng đồng hồ. 💀")
    .weight(0.78)
    .register();

  defineEffect("power", "Frost Armor")
    .description("Nhận +2 Durability.")
    .weight(0.78)
    .addStat("durability", 2)
    .register();

  defineEffect("power", "Lightning Enchant")
    .description("Nhận +2 Speed.")
    .weight(0.78)
    .addStat("speed", 2)
    .register();

  defineEffect("power", "Chaos Enchantment")
    .description("Sau Combat: +1 Str và +1 MA khi trong nhánh thua.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 1,
      timing: "after_combat",
      target: "self",
      conditions: [{ type: "bracket", bracket: "loser" }],
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 1,
      timing: "after_combat",
      target: "self",
      conditions: [{ type: "bracket", bracket: "loser" }],
    })
    .register();

  defineEffect("power", "Dream Manipulation")
    .description("Debuff: đối phương -2 IQ và -1 Speed.")
    .weight(0.78)
    .debuffOpponent("iq", 2)
    .debuffOpponent("speed", 1)
    .register();

  defineEffect("power", "Powerful Strike")
    .description("Nếu có vũ khí, nhận +2 MA.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 2,
      timing: "immediate",
      target: "self",
      conditions: [{ type: "has_item", itemType: "weapon" }],
    })
    .register();

  defineEffect("power", "Fragrant")
    .description("Thơm tho dễ chịu.")
    .weight(0.78)
    .register();

  defineEffect("power", "Voidwalking")
    .description("Buff: Nhận +2 Speed.")
    .weight(0.78)
    .addStat("speed", 2)
    .register();

  defineEffect("power", "Odin Blessing")
    .description(
      "+2 Strength. Sau Combat Thua: Chuyển thành +2 vào Stat cao nhất.",
    )
    .weight(0.78)
    .addStat("strength", 2)
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "odin_blessing_convert_to_highest",
    })
    .register();

  defineEffect("power", "Misty Step Ahead")
    .description("[PVE ONLY] Trong combat: Tổ đội khởi đầu với 1 điểm.")
    .weight(0.78)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "team",
      conditions: [{ type: "always" }],
    })
    .register();

  defineEffect("power", "Ballet Dancing")
    .description("Múa dẻo 💃")
    .weight(0.78)
    .register();

  defineEffect("power", "Luck Manipulation")
    .description("Trước Combat: Từ vòng 64, 15% +1 all stats, 5% +2 all stats.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "probability", chance: 15 }],
      customHandler: "luck_manipulation_round_64_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 2,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "probability", chance: 5 }],
      customHandler: "luck_manipulation_round_64_check",
    })
    .register();

  defineEffect("power", "Scrying")
    .description("Debuff: Đối thủ 40% -4 Stat mạnh nhất.")
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "highest",
      value: -4,
      timing: "before_combat",
      target: "opponent",
      conditions: [{ type: "probability", chance: 40 }],
    })
    .register();

  defineEffect("power", "Cold Breeze")
    .description("Mát lạnh!")
    .weight(0.78)
    .register();

  defineEffect("power", "Bucking Bronco")
    .description("Sau Combat: Thắng round MA và thắng trận, +1 MA. (Stack)")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 1,
      timing: "after_combat_win",
      target: "self",
      stackable: true,
      customHandler: "bucking_bronco_ma_round_win",
    })
    .register();

  defineEffect("power", "Detect Thoughts")
    .description("Trước Combat: Base IQ cao hơn đối thủ, BIQ trong trận +2.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 2,
      timing: "before_combat",
      target: "self",
      conditions: [
        {
          type: "stat_compare",
          stat: "iq",
          compareWith: "opponent",
          operator: ">",
          useBaseStats: true,
        },
      ],
    })
    .register();

  defineEffect("power", "Arcana Blast")
    .description("Debuff: Đối thủ nhận -3 Durability.")
    .weight(0.78)
    .debuffOpponent("durability", 3)
    .register();

  defineEffect("power", "Blood Frenzy")
    .description("-3 IQ và -3 BIQ, +2 all stat còn lại.")
    .weight(0.78)
    .addStat("iq", -3)
    .addStat("biq", -3)
    .addStat("strength", 2)
    .addStat("speed", 2)
    .addStat("durability", 2)
    .addStat("ma", 2)
    .register();

  defineEffect("power", "Analysis Sins")
    .description(
      "Buff: vs Demon/Vampire/Spirit/Orc/Skeleton/Goblin, +1 IQ và +1 Strength.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [
        {
          type: "race_match",
          races: ["Demon", "Vampire", "Spirit", "Orc", "Skeleton", "Goblin"],
        },
      ],
    })
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [
        {
          type: "race_match",
          races: ["Demon", "Vampire", "Spirit", "Orc", "Skeleton", "Goblin"],
        },
      ],
    })
    .register();

  defineEffect("power", "Cleaning Sins")
    .description(
      "Buff: vs Demon/Vampire/Spirit/Orc/Skeleton/Goblin, +1 BIQ và +1 Dura.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [
        {
          type: "race_match",
          races: ["Demon", "Vampire", "Spirit", "Orc", "Skeleton", "Goblin"],
        },
      ],
    })
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [
        {
          type: "race_match",
          races: ["Demon", "Vampire", "Spirit", "Orc", "Skeleton", "Goblin"],
        },
      ],
    })
    .register();

  defineEffect("power", "Hydrate")
    .description("Cơ thể bạn được cung cấp đủ nước. 💦💦💦")
    .weight(0.78)
    .register();

  defineEffect("power", "Groundwork")
    .description("Buff: Có ít nhất 3 Power khác, +2 Strength và +2 Speed.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "groundwork_3_powers_check",
    })
    .register();

  defineEffect("power", "Dominator")
    .description(
      "Trong Combat: Thua ít nhất 2/3 round đầu, Debuff: đối phương -1 all stats.",
    )
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "all",
      value: -1,
      timing: "during_combat",
      target: "opponent",
      duration: "combat",
      customHandler: "dominator_2_of_3_loses",
    })
    .register();

  defineEffect("power", "Ice Spike")
    .description("Debuff: Đối thủ nhận -2 Durability.")
    .weight(0.78)
    .debuffOpponent("durability", 2)
    .register();

  defineEffect("power", "Stat Absorption")
    .description("Sau Combat thắng: +1 vào chỉ số đối thủ có cao nhất.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 1,
      timing: "after_combat_win",
      target: "self",
      customHandler: "stat_absorption_opponent_highest",
    })
    .register();

  defineEffect("power", "Golden Vow")
    .description("Trong combat: Khởi đầu với +1 điểm.")
    .weight(0.78)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
    })
    .register();

  defineEffect("power", "Acid Breath")
    .description(
      'Debuff: -1 Durability đối thủ. Sau Combat thắng: Nhận Power "Poison Breath".',
    )
    .weight(0.78)
    .debuffOpponent("durability", 1)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Poison Breath",
      timing: "after_combat_win",
      target: "self",
    })
    .register();

  defineEffect("power", "Poison Breath")
    .description(
      'Debuff: -1 IQ đối thủ. Sau Combat thua: Nhận Power "Garlic Breath".',
    )
    .weight(0.78)
    .debuffOpponent("iq", 1)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Garlic Breath",
      timing: "after_combat_lose",
      target: "self",
    })
    .register();

  defineEffect("power", "Zoltraak")
    .description(
      "+3 BIQ. Trong Combat: Round BIQ diễn ra 2 lần, mỗi lần đều tính điểm.",
    )
    .weight(0.78)
    .addStat("biq", 3)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "zoltraak_double_biq_round",
    })
    .register();

  defineEffect("power", "Encroaching Shadow")
    .description("Trong combat: 75% nhận +7 Speed.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: 7,
      timing: "before_combat",
      target: "self",
      duration: "combat",
      customHandler: "encroaching_shadow_wheel",
    })
    .register();

  defineEffect("power", "No Stopping Me")
    .description(
      "Trong Combat: Nếu 3 round đầu so le (thắng-thua-thắng hoặc thua-thắng-thua), Buff: +3 IQ, +3 BIQ, +3 MA.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 3,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "no_stopping_me_alternating_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 3,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "no_stopping_me_alternating_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 3,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "no_stopping_me_alternating_check",
    })
    .register();

  defineEffect("power", "Mystifying Murmur")
    .description("Trong combat: Đối thủ nhận Debuff: -3 Dura.")
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "durability",
      value: -3,
      timing: "during_combat",
      target: "opponent",
    })
    .register();

  defineEffect("power", "Spell Flux")
    .description(
      '1 Power kích hoạt "Trong Combat" của bạn kích hoạt lần đầu sẽ được kích hoạt 2 lần.',
    )
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "spell_flux_double_first_in_combat",
    })
    .register();

  // ============================================================================
  // SPECIAL POWERS
  // ============================================================================

  defineEffect("power", "Cinder Flickering")
    .description(
      'Sau Combat: Khi 2 người có Cinder Flickering trong cùng 1 Combat, người thắng nhận Char Dev "Lord of Cinder".',
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "cinder_flickering_check",
    })
    .register();

  defineEffect("power", "Darwin Evolution Theory")
    .description(
      "Sau Combat: Thăng hạng chủng tộc của mình lên 1 bậc. (Cả tộc của bạn được nâng bậc)",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "darwin_evolution_race_up",
    })
    .register();

  defineEffect("power", "Algorithms Are Clear")
    .description(
      "Sau Combat: Cộng tổng Base Stat đối thủ chia 6, thay thế Base Stat thấp nhất của bạn thành con số đó.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "algorithms_are_clear_replace_lowest",
    })
    .register();

  defineEffect("power", "Eternal Mangekyou Sharingan")
    .description(
      "Trước Combat: Kích hoạt ngẫu nhiên 1 trong 3 hiệu ứng - Amaterasu: đối thủ -6 Dura; Tsukuyomi: đối thủ -6 IQ; Susanoo: đối thủ -6 Strength.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "opponent",
      customHandler: "eternal_mangekyou_random_effect",
    })
    .register();

  defineEffect("power", "Adapt")
    .description(
      "Ghi nhớ mọi Power gặp. Trước combat: Vô hiệu hóa toàn bộ Power của đối thủ mà bản thân đã ghi nhớ.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "opponent",
      customHandler: "adapt_disable_known_powers",
    })
    .register();

  defineEffect("power", "Hey Ya!")
    .description("Bạn được cổ vũ tinh thần.")
    .weight(0)
    .register();

  defineEffect("power", "Jogan")
    .description("Mắt sáng, không bị cận.")
    .weight(0)
    .register();

  defineEffect("power", "Super Lucky")
    .description(
      "Khi thua trận, 15% lật kèo thắng. Nếu không, thêm 1 cơ hội 10% lật kèo.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "super_lucky_comeback_check",
    })
    .register();

  defineEffect("power", "Valkyrie's Blessing")
    .description(
      "Miễn nhiễm AIDS. Miễn nhiễm Debuff. Tie-break 66% nghiêng về bạn. Power này không thể bị tác động/vô hiệu/xóa bỏ.",
    )
    .weight(0)
    .effect({
      type: "immunity",
      immuneTo: ["aids", "debuff"],
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "immunity",
      immuneTo: ["remove_valkyrie_blessing"],
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("power", "4 Hit Combo")
    .description(
      "Trong Combat: Round BIQ thắng sẽ nhận điểm để bằng với đối thủ. Không có tác dụng nếu đang hơn điểm.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "before_combat_end",
      target: "self",
      customHandler: "four_hit_combo_biq_equalize",
    })
    .register();

  defineEffect("power", "Sovngarde's Blessing")
    .description(
      "Trong combat: Khởi đầu trận đấu với +1 điểm và Buff: +1 All Stats.",
    )
    .weight(0)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "before_combat",
      target: "self",
      duration: "combat",
    })
    .register();

  defineEffect("power", "Glory glory Man United")
    .description(
      "Trong combat: Với mỗi bàn thua EPL gần nhất của MU, -1 all stats. MU thắng ≥3-0: +7 all stats.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "glory_man_united_epl_check",
    })
    .register();

  defineEffect("power", "Cold Mirage")
    .description(
      "Trong combat: Sau mỗi round thắng, quay 1 chỉ số từ các round chưa thi đấu. Đối thủ không nhận điểm khi thắng những round bị quay ra.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "cold_mirage_spin_unused_round",
    })
    .register();

  defineEffect("power", "Golden Parry")
    .description(
      "Trong combat: Sau mỗi round thua, đối thủ có 35% không nhận được điểm.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "on_round_lose",
      target: "self",
      conditions: [{ type: "probability", chance: 35 }],
      customHandler: "golden_parry_deny_opponent_point",
    })
    .register();

  // ============================================================================
  // SUMMONS
  // ============================================================================

  defineEffect("summon", "Chihuahua")
    .description("-1 all stats.")
    .weight(10)
    .addAllStats(-1)
    .register();
  defineEffect("summon", "Mufasa")
    .description("+3 Strength.")
    .weight(12)
    .addStat("strength", 3)
    .register();
  defineEffect("summon", "Pack of Wolves")
    .description("+3 Speed.")
    .weight(12)
    .addStat("speed", 3)
    .register();
  defineEffect("summon", "Earth Golem")
    .description("+3 Durability.")
    .weight(12)
    .addStat("durability", 3)
    .register();
  defineEffect("summon", "Water Elemental")
    .description("+3 IQ.")
    .weight(12)
    .addStat("iq", 3)
    .register();
  defineEffect("summon", "Imp")
    .description("+3 BIQ.")
    .weight(12)
    .addStat("biq", 3)
    .register();
  defineEffect("summon", "Igris")
    .description("+3 Martial Arts.")
    .weight(12)
    .addStat("ma", 3)
    .register();
  defineEffect("summon", "Numby")
    .description("Trong Combat: +4 vào 1 chỉ số ngẫu nhiên.")
    .weight(12)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 4,
      timing: "during_combat",
      target: "self",
    })
    .register();
  defineEffect("summon", "Wyvern's Egg")
    .description("Ở trận chung kết tổng, nhận 2 điểm khởi đầu.")
    .weight(3)
    .effect({
      type: "combat_points",
      points: 2,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "bracket", bracket: "finals" }],
    })
    .register();
  defineEffect("summon", "Creator's Cat")
    .description('Nhận 1 lần Char Dev: "Creator\'s Favor".')
    .weight(3)
    .effect({
      type: "grant_char_dev",
      grantType: "char_dev",
      grantName: "Creator's Favor",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();
}

export function registerPowerHandlers(): void {
  console.log("Power handlers registered");
}

export function registerPowerCombatHandlers(): void {
  console.log("Power combat handlers registered");
}
