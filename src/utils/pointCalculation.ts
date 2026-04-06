import { Character } from "../types/character";
import { PvPPlayerData, StepCombatState } from "../types/battleZone";

export interface ComputeRoundPointsContext {
  roundSpinResults: Record<string, { label: string; isSuccess: boolean }>;
  disabledItems: Set<string>;
  player1: PvPPlayerData | null;
  player2: PvPPlayerData | null;
  oneTrickPonyStat: Record<string, string>;
  huntersMarkStat: Record<string, string>;
  tricksterResult: Record<string, string | null>;
  stepState: StepCombatState | null;
  getPerRoundEffects: (
    char: Character | undefined,
    playerNo?: number,
  ) => { onWin: string[]; onLose: string[]; onTie: string[]; gamblerStackCount: number };
}

export function computeRoundPoints(
  side: "player1" | "player2",
  winner: "player1" | "player2" | "tie",
  roundIdx: number,
  effects: { onWin: string[]; onLose: string[]; onTie: string[]; gamblerStackCount?: number },
  statKey?: string,
  roundsWonBefore?: number,
  ctx?: ComputeRoundPointsContext,
): {
  pts: number;
  pending: boolean;
  color: string;
  autoApplied?: boolean;
  engineBase?: number;
  /** Điểm điều chỉnh cho đối thủ (âm = trừ điểm đối thủ, ví dụ Misericorde -1) */
  opponentPtsAdjust?: number;
} {
  if (!ctx) {
    return { pts: winner === side ? 1 : 0, pending: false, color: "text-gray-600" };
  }

  const {
    roundSpinResults,
    disabledItems,
    player1,
    player2,
    oneTrickPonyStat,
    huntersMarkStat,
    stepState,
    getPerRoundEffects,
  } = ctx;

  const isWinner = winner === side;
  const isLoser = winner !== side && winner !== "tie";
  const isTie = winner === "tie";

  const hasGambler = effects.onWin.includes("Gambler");
  const hasCrit = effects.onWin.includes("Critical Strike");
  const hasEvasion = effects.onLose.includes("Evasion");
  const hasCruelty = effects.onTie.includes("Cruelty");
  const hasBlind = effects.onWin.includes("Blind");
  const hasMute = effects.onLose.includes("Mute");
  const hasRangerRed = effects.onWin.includes("Ranger-Red");
  const hasDivineSmite = effects.onWin.includes("Divine Smite");
  const hasBloodthirsty = effects.onWin.includes("Bloodthirsty");

  const gamblerSpun = roundSpinResults[`${roundIdx}-Gambler-${side}`];
  const critSpun = roundSpinResults[`${roundIdx}-Critical Strike-${side}`];
  const evasionSpun = roundSpinResults[`${roundIdx}-Evasion-${side}`];
  const crueltySpun = roundSpinResults[`${roundIdx}-Cruelty-${side}`];
  const blindSpun = roundSpinResults[`${roundIdx}-Blind-${side}`];
  const muteSpun = roundSpinResults[`${roundIdx}-Mute-${side}`];
  const rangerRedSpun = roundSpinResults[`${roundIdx}-Ranger-Red-${side}`];

  // One Trick Pony: thắng stat được chọn = 3pts; thắng stat khác = 0pts
  const char = side === "player1" ? player1?.character : player2?.character;
  const charSources = [
    ...(char?.quirks || [])
      .filter((q) => !q.isLost)
      .map((q) => q.name.toLowerCase()),
    ...(char?.archetypes || []).map((a) => a.toLowerCase()),
  ];
  // Weak-Knee: round thắng đầu tiên không nhận điểm
  if (roundsWonBefore !== undefined) {
    const hasWeakKnee =
      (char?.quirks || [])
        .filter((q: any) => !q.isLost)
        .some((q: any) => q.name === "Weak-Knee") &&
      !disabledItems.has(
        `${(side === "player1" ? player1 : player2)?.no}-quirk-Weak-Knee`,
      );
    if (hasWeakKnee && isWinner && roundsWonBefore === 0) {
      return { pts: 0, pending: false, color: "text-gray-500" };
    }
  }
  // Golden Parry check helper — dùng sau khi tính base OTP hoặc normal
  const oppSideForParry = side === "player1" ? "player2" : "player1";
  const oppEffsForParry = isWinner
    ? getPerRoundEffects(
        oppSideForParry === "player1"
          ? player1?.character
          : player2?.character,
        oppSideForParry === "player1" ? player1?.no : player2?.no,
      )
    : { onWin: [], onLose: [], onTie: [], gamblerStackCount: 0 };
  const goldenParrySpun = isWinner
    ? roundSpinResults[`${roundIdx}-Golden Parry-${oppSideForParry}`]
    : undefined;
  const oppHasGoldenParry = oppEffsForParry.onLose.includes("Golden Parry");

  const hasOTP = charSources.includes("one trick pony");
  if (hasOTP && isWinner && statKey) {
    const otpChosenStat = oneTrickPonyStat[side]; // short key e.g. "str"
    if (otpChosenStat) {
      const otpBase = otpChosenStat === statKey ? 3 : 0;
      // Check Golden Parry sau khi biết otpBase
      if (oppHasGoldenParry) {
        if (!goldenParrySpun)
          return {
            pts: otpBase,
            pending: true,
            color: "text-amber-400",
            autoApplied: true,
          };
        if (goldenParrySpun.isSuccess)
          return {
            pts: 0,
            pending: false,
            color: "text-amber-300",
            autoApplied: true,
          }; // block toàn bộ điểm
      }
      return {
        pts: otpBase,
        pending: false,
        color:
          otpChosenStat === statKey ? "text-yellow-300" : "text-gray-500",
        autoApplied: true,
      };
    }
    // Wheel chưa quay — không block next round, dùng điểm mặc định +1
    return { pts: 1, pending: false, color: "text-yellow-400" };
  }

  // Cruelty: on tie, spin to decide who gets the point
  if (isTie) {
    const oppSide = side === "player1" ? "player2" : "player1";
    const oppEffects = getPerRoundEffects(
      side === "player1" ? player2?.character : player1?.character,
      side === "player1" ? player2?.no : player1?.no,
    );
    const oppHasCruelty = oppEffects.onTie.includes("Cruelty");
    const oppCrueltySpun = roundSpinResults[`${roundIdx}-Cruelty-${oppSide}`];

    if (hasCruelty) {
      // This side has Cruelty: spin decides
      if (!crueltySpun)
        return { pts: 0, pending: true, color: "text-fuchsia-400" };
      if (crueltySpun.isSuccess)
        return { pts: 1, pending: false, color: "text-fuchsia-300" };
      return { pts: 0, pending: false, color: "text-gray-600" };
    }
    if (oppHasCruelty) {
      // Opponent has Cruelty: if opponent's spin failed (isSuccess=false) → this side gets +1
      if (!oppCrueltySpun)
        return { pts: 0, pending: true, color: "text-fuchsia-400" };
      if (!oppCrueltySpun.isSuccess)
        return { pts: 1, pending: false, color: "text-fuchsia-300" };
      return { pts: 0, pending: false, color: "text-gray-600" };
    }
  }

  if (isWinner) {
    // The Sand of Time (from opponent/loser): nếu thành công → winner không nhận điểm base
    {
      const oppSideForSand = side === "player1" ? "player2" : "player1";
      const oppCharForSand =
        oppSideForSand === "player1"
          ? player1?.character
          : player2?.character;
      const oppNoForSand =
        oppSideForSand === "player1" ? player1?.no : player2?.no;
      const oppEffsForSand = getPerRoundEffects(oppCharForSand, oppNoForSand);
      if (oppEffsForSand.onLose.includes("The Sand of Time")) {
        // Kiểm tra isFirstLoss cho loser side
        const isFirstLossForOpp = (() => {
          const logs = stepState?.roundLogs ?? [];
          // Zoltraak BIQ×2: nếu có 2+ logs với roundIndex=roundIdx, skip Sand
          if (logs.filter((l) => l.roundIndex === roundIdx).length >= 2)
            return false;
          for (const log of logs) {
            if (log.roundIndex >= roundIdx) break;
            if (log.winner !== "tie" && log.winner !== oppSideForSand)
              return false;
          }
          return true;
        })();
        if (isFirstLossForOpp) {
          const sandOppKey = `${roundIdx}-The Sand of Time-${oppSideForSand}`;
          const sandOppSpun = roundSpinResults[sandOppKey];
          const oppHasSpellFlux = (oppCharForSand?.powers || []).some(
            (p: any) =>
              !p?.isLost &&
              (typeof p === "string" ? p : p.name)
                ?.toLowerCase()
                .startsWith("spell flux"),
          );
          if (oppHasSpellFlux) {
            // Spell Flux: cần cả 2 spin xong mới biết kết quả
            const sand2OppSpun =
              roundSpinResults[
                `${roundIdx}-The Sand of Time-2-${oppSideForSand}`
              ];
            if (!sandOppSpun || !sand2OppSpun)
              return { pts: 1, pending: true, color: "text-amber-400" };
            // Nếu ít nhất 1 sand thành công → winner mất điểm
            if (sandOppSpun.isSuccess || sand2OppSpun.isSuccess)
              return { pts: 0, pending: false, color: "text-amber-400" };
            // Cả 2 thất bại → winner vẫn nhận +1 bình thường (fall through)
          } else {
            if (!sandOppSpun) {
              // Chưa spin → pending ở loser side sẽ block Next Round
            } else if (sandOppSpun.isSuccess) {
              // Sand thành công → winner không nhận điểm base
              return { pts: 0, pending: false, color: "text-amber-400" };
            }
            // Sand thất bại → winner vẫn nhận +1 bình thường
          }
        }
      }
    }
    // Cautious (on opponent): đối thủ có Cautious → ta không nhận điểm round STR
    if (statKey === "str") {
      const oppSideForCautious = side === "player1" ? "player2" : "player1";
      const oppCharForCautious =
        oppSideForCautious === "player1"
          ? player1?.character
          : player2?.character;
      const oppNoForCautious =
        oppSideForCautious === "player1" ? player1?.no : player2?.no;
      const oppEffsForCautious = getPerRoundEffects(
        oppCharForCautious,
        oppNoForCautious,
      );
      if (oppEffsForCautious.onWin.includes("Cautious-Self")) {
        // autoApplied: true vì computeRoundStep đã chặn điểm qua blockOpponentPoint
        // patchedState phải biết base score là 0 (không phải 1) → diff = 0 - 0 = 0
        return {
          pts: 0,
          pending: false,
          color: "text-gray-500",
          autoApplied: true,
        };
      }
    }
    // Blind: 15% không nhận điểm round này (kiểm tra trước Gambler/Crit)
    if (hasBlind && !blindSpun)
      return { pts: 1, pending: true, color: "text-violet-400" };
    if (hasBlind && blindSpun.isSuccess)
      return { pts: 0, pending: false, color: "text-gray-500" };
    // Gambler replaces base point (spin decides 2 or 0 — patch mechanism applies diff)
    if (hasGambler && !gamblerSpun)
      return { pts: 1, pending: true, color: "text-amber-400" };
    let base = hasGambler ? (gamblerSpun!.isSuccess ? 2 : 0) : 1;
    const hasSpinEffect = hasGambler; // track whether a spin effect changed base from 1
    // Critical Strike adds +1 bonus
    if (hasCrit && !critSpun)
      return { pts: base, pending: true, color: "text-amber-400" };
    if (hasCrit && critSpun?.isSuccess) base += 1;
    // Bloodthirsty: +1 điểm bonus khi thắng (patch mechanism — engine skip extra_point_on_win)
    if (hasBloodthirsty) base += 1;
    // Divine Smite: +1 điểm khi thắng round MA (engine xử lý qua divine_smite_ma_round handler)
    // → engineBase phải tính Divine Smite để diff patch = 0 (không patch thêm)
    const divineSmiteBonus = hasDivineSmite && statKey === "ma" ? 1 : 0;
    if (divineSmiteBonus) base += 1;
    // Yamato Blade: +1 điểm khi thắng round SPD hoặc MA (patch mechanism — engine skip extra_point_on_win)
    if (effects.onWin.includes("Yamato Blade-SPD") && statKey === "spd")
      base += 1;
    if (effects.onWin.includes("Yamato Blade-MA") && statKey === "ma")
      base += 1;
    // Red Ranger: 20% +2 điểm khi thắng round Strength
    if (hasRangerRed && statKey === "str") {
      if (!rangerRedSpun)
        return { pts: base, pending: true, color: "text-red-400" };
      if (rangerRedSpun.isSuccess) base += 2;
    }
    // Pennyworthy: 36% +1 điểm khi thắng (spin effect — patch needed)
    const hasPennyworthyWin = effects.onWin.includes("Pennyworthy-Win");
    const pennyworthyWinSpun =
      roundSpinResults[`${roundIdx}-Pennyworthy-Win-${side}`];
    if (hasPennyworthyWin && !pennyworthyWinSpun)
      return { pts: base, pending: true, color: "text-lime-400" };
    if (hasPennyworthyWin && pennyworthyWinSpun?.isSuccess) base += 1;
    if (effects.onWin.includes("Hunter's Mark")) {
      const hmsChosen = huntersMarkStat[side]; // label e.g. "Strength"
      const STAT_KEY_TO_LABEL_HM: Record<string, string> = {
        str: "Strength",
        spd: "Speed",
        dur: "Durability",
        iq: "IQ",
        biq: "BIQ",
        ma: "MA",
      };
      const roundStatLabelHM = STAT_KEY_TO_LABEL_HM[statKey ?? ""] ?? "";
      if (hmsChosen === roundStatLabelHM) {
        // Spell Flux + Hunter's Mark: thắng round đó +2 thay vì +1
        const hmChar =
          side === "player1" ? player1?.character : player2?.character;
        const hmHasSpellFlux = (hmChar?.powers || []).some(
          (pw: any) =>
            !pw?.isLost &&
            (typeof pw === "string" ? pw : pw.name)
              ?.toLowerCase()
              .startsWith("spell flux"),
        );
        base += hmHasSpellFlux ? 2 : 1;
        return {
          pts: base,
          pending: false,
          color: "text-yellow-400",
          autoApplied: true,
        };
      }
    }
    // Golden Parry (from opponent): override toàn bộ điểm về 0 (spin effect — patch needed)
    if (oppHasGoldenParry) {
      if (!goldenParrySpun)
        return { pts: base, pending: true, color: "text-amber-400" };
      if (goldenParrySpun.isSuccess)
        return { pts: 0, pending: false, color: "text-amber-300" }; // block toàn bộ điểm
    }
    const color =
      base === 0
        ? "text-gray-500"
        : base >= 2
          ? "text-amber-300"
          : "text-blue-400";
    // autoApplied: true chỉ khi computeRoundStep đã xử lý effect trong engine
    // Bloodthirsty và Divine Smite dùng patch mechanism (extra_point_on_win bị skip trong engine)
    const isSpinDriven =
      hasSpinEffect ||
      hasCrit ||
      hasRangerRed ||
      hasPennyworthyWin ||
      oppHasGoldenParry;
    const hasYamatoBlade =
      (effects.onWin.includes("Yamato Blade-SPD") && statKey === "spd") ||
      (effects.onWin.includes("Yamato Blade-MA") && statKey === "ma");
    // isPatchDriven: effect được xử lý bằng patch mechanism (không phải trong engine)
    // Bloodthirsty: engine skip extra_point_on_win, patch tính điểm
    // Yamato Blade: engine skip extra_point_on_win (không có customHandler), patch tính điểm
    // Divine Smite: engine ĐÃ tính trong divine_smite_ma_round handler → KHÔNG patch thêm
    const isPatchDriven = hasBloodthirsty || hasYamatoBlade;
    const autoApplied = base !== 1 && !isSpinDriven && !isPatchDriven;
    // Debug log: breakdown điểm từng round
    if (
      base !== 1 ||
      hasCrit ||
      hasDivineSmite ||
      hasBloodthirsty ||
      effects.onWin.includes("Yamato Blade-SPD") ||
      effects.onWin.includes("Yamato Blade-MA")
    ) {
      const breakdown: string[] = [`base=1`];
      if (hasGambler)
        breakdown.push(
          `Gambler→${gamblerSpun?.isSuccess ? "+1(2pt)" : "-1(0pt)"}`,
        );
      if (hasCrit && critSpun?.isSuccess) breakdown.push(`+Crit`);
      if (hasBloodthirsty) breakdown.push(`+Bloodthirsty`);
      if (hasDivineSmite && statKey === "ma")
        breakdown.push(`+DivineSmite(MA)`);
      if (effects.onWin.includes("Yamato Blade-SPD") && statKey === "spd")
        breakdown.push(`+YamatoBlade(SPD)`);
      if (effects.onWin.includes("Yamato Blade-MA") && statKey === "ma")
        breakdown.push(`+YamatoBlade(MA)`);
      if (hasRangerRed && statKey === "str" && rangerRedSpun?.isSuccess)
        breakdown.push(`+RangerRed(2)`);
      // console.log(
      //   `[RoundPoints] R${roundIdx + 1} ${side} wins ${statKey ?? "?"}: ${breakdown.join(", ")} = ${base}pts`,
      // );
      void breakdown;
    }
    // engineBase: điểm mà engine (computeRoundStep) đã tính — dùng để tính diff patch đúng
    // Engine luôn tính +1 khi thắng (+ Divine Smite nếu có)
    // Gambler: pts=2 hoặc 0, engineBase=1 → diff=+1 hoặc -1
    const engineBase = 1 + divineSmiteBonus;
    return { pts: base, pending: false, color, autoApplied, engineBase };
  }

  if (isLoser) {
    // Mute: 10% bị -1 stat — không ảnh hưởng điểm, chỉ hiển thị button để GM ghi nhận
    if (hasMute && !muteSpun)
      return { pts: 0, pending: true, color: "text-pink-400" };
    // Pennyworthy-Lose: 36% +2 stat round thua — không ảnh hưởng điểm, GM tự apply
    const hasPennyworthyLose = effects.onLose.includes("Pennyworthy-Lose");
    const pennyworthyLoseSpun =
      roundSpinResults[`${roundIdx}-Pennyworthy-Lose-${side}`];
    if (hasPennyworthyLose && !pennyworthyLoseSpun)
      return { pts: 0, pending: true, color: "text-emerald-400" };
    if (hasEvasion) {
      if (!evasionSpun)
        return { pts: 0, pending: true, color: "text-emerald-400" };
      if (evasionSpun.isSuccess)
        return { pts: 1, pending: false, color: "text-emerald-300" };
    }
    const hasMisericorde = effects.onLose.includes("Misericorde");
    const misericordeSpun =
      roundSpinResults[`${roundIdx}-Misericorde-${side}`];
    if (hasMisericorde) {
      if (!misericordeSpun)
        return { pts: 0, pending: true, color: "text-violet-400" };
      if (misericordeSpun.isSuccess)
        return { pts: 1, pending: false, color: "text-violet-300", opponentPtsAdjust: -1 };
    }
    // The Sand of Time: 40% +1 điểm bản thân -1 điểm đối thủ, chỉ lần đầu thua
    // triggerOnce: chỉ quay nếu chưa có round thua nào trước đó (roundIdx là lần thua đầu)
    const hasSandOfTime = effects.onLose.includes("The Sand of Time");
    if (hasSandOfTime) {
      const isFirstLoss = (() => {
        const logs = stepState?.roundLogs ?? [];
        // Zoltraak BIQ×2: nếu có 2+ logs với roundIndex=roundIdx, đây là BIQ×2 context
        // Sand không trigger ở BIQ×2 (display đã filter, block Next cũng skip)
        if (logs.filter((l) => l.roundIndex === roundIdx).length >= 2)
          return false;
        for (const log of logs) {
          if (log.roundIndex >= roundIdx) break;
          if (log.winner !== "tie" && log.winner !== side) return false;
        }
        return true;
      })();
      const sandSpun =
        roundSpinResults[`${roundIdx}-The Sand of Time-${side}`];
      if (isFirstLoss) {
        const charForFlux =
          side === "player1" ? player1?.character : player2?.character;
        const sandPowers = charForFlux?.powers || [];
        const hasSpellFlux = sandPowers.some(
          (p: any) =>
            !p?.isLost &&
            (typeof p === "string" ? p : p.name)
              ?.toLowerCase()
              .startsWith("spell flux"),
        );
        if (hasSpellFlux) {
          // Spell Flux: 2 lần spin độc lập — cả 2 phải spin xong mới next round
          const sand2Spun =
            roundSpinResults[`${roundIdx}-The Sand of Time-2-${side}`];
          if (!sandSpun || !sand2Spun)
            return { pts: 0, pending: true, color: "text-amber-500" };
          const pts =
            (sandSpun.isSuccess ? 1 : 0) + (sand2Spun.isSuccess ? 1 : 0);
          return {
            pts,
            pending: false,
            color: pts > 0 ? "text-amber-300" : "text-gray-600",
          };
        }
        if (!sandSpun)
          return { pts: 0, pending: true, color: "text-amber-500" };
        if (sandSpun.isSuccess) {
          return { pts: 1, pending: false, color: "text-amber-300" };
        }
      }
    }
    // Golden Parry: 35% chặn đối thủ không nhận điểm khi thua round
    // Nếu có Golden Parry, cần quay để xác định — kết quả ảnh hưởng lên điểm của đối thủ
    const hasGoldenParry = effects.onLose.includes("Golden Parry");
    const goldenParryLoserSpun =
      roundSpinResults[`${roundIdx}-Golden Parry-${side}`];
    if (hasGoldenParry && !goldenParryLoserSpun)
      return { pts: 0, pending: true, color: "text-amber-400" };
    // Golden Parry không ảnh hưởng điểm của người thua (luôn 0)
    return { pts: 0, pending: false, color: "text-gray-600" };
  }

  return { pts: isWinner ? 1 : 0, pending: false, color: "text-gray-600" };
}
