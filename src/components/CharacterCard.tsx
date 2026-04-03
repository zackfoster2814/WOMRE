import React, { useMemo } from "react";
import type { Character } from "../types/character";
import { EffectResolver } from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import type { CharacterEffects } from "../effects/types";

let effectsInitialized = false;
function ensureEffectsInitialized() {
  if (!effectsInitialized) { initializeEffectData(); effectsInitialized = true; }
}

interface CharacterCardProps {
  character: Character;
  onClose?: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onClose }) => {
  ensureEffectsInitialized();
  const characterEffects: CharacterEffects = useMemo(
    () => EffectResolver.calculateCharacterEffects(character),
    [character],
  );
  const baseTotal = Object.values(character.stats).reduce((s, v) => s + v, 0);
  const totalPower = Object.values(characterEffects.totalStats).reduce((s, v) => s + v, 0);

  const tagBase = "px-2.5 py-0.5 text-xs font-mono border";

  return (
    <div className="fixed inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
      <div
        className="bg-surface-container border border-outline/25 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
        style={{ boxShadow: "0 0 60px 10px rgba(0,0,0,0.6), inset 0.5px 0.5px 0 rgba(255,255,255,0.06)" }}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-outline/20 bg-surface-low">
          {/* Decorative top line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="flex justify-between items-start">
            <div>
              <p className="font-mono text-[10px] text-primary/50 tracking-[0.3em] uppercase mb-1">
                No. {character.no}
              </p>
              <h2 className="font-display text-3xl font-bold text-white">{character.name}</h2>
              <p className="text-gray-400 text-sm mt-0.5">@{character.username}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-primary transition-colors text-2xl leading-none mt-1"
              >
                ×
              </button>
            )}
          </div>

          {/* Tags */}
          <div className="mt-4 flex gap-1.5 flex-wrap">
            {character.isParasite && character.parasiteType && (
              <span className={`${tagBase} border-error/40 text-error bg-error/10`}>
                Ký Sinh: {character.parasiteType}
                {character.wrathStacks !== undefined && character.wrathStacks > 0 && (
                  <span className="ml-1 bg-error/20 px-1">Wrath: {character.wrathStacks}</span>
                )}
              </span>
            )}
            <span className={`${tagBase} border-secondary/30 text-secondary bg-secondary/8`}>
              {character.race.race}
              {character.race.subRace && ` — ${character.race.subRace}`}
            </span>
            {(character.nestedArchetypes && character.nestedArchetypes.length > 0
              ? character.nestedArchetypes.map((arch, i) => (
                  <span key={i} className={`${tagBase} border-primary/30 text-primary/80 bg-primary/8`}>
                    {arch.name}{arch.subType && ` → ${arch.subType}`}{arch.subSubType && ` → ${arch.subSubType}`}
                  </span>
                ))
              : (character.archetypes || []).map((a, i) => (
                  <span key={i} className={`${tagBase} border-primary/30 text-primary/80 bg-primary/8`}>{a}</span>
                ))
            )}
            {(character.nestedHouses && character.nestedHouses.length > 0
              ? character.nestedHouses.filter(h => !h.isLost).map((h, i) => (
                  <span key={i} className={`${tagBase} border-yellow-500/30 text-yellow-400 bg-yellow-500/8`}>
                    {h.name}{h.subType && ` → ${h.subType}`}
                  </span>
                ))
              : (character.houses || []).filter(h => !h.isLost).map((h, i) => (
                  <span key={i} className={`${tagBase} border-yellow-500/30 text-yellow-400 bg-yellow-500/8`}>{h.name}</span>
                ))
            )}
            {character.team && (
              <span className={`${tagBase} border-tertiary/30 text-tertiary bg-tertiary/8`}>Team {character.team}</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Parasite info */}
          {character.isParasite && character.parasiteType && (
            <section className="border border-error/20 bg-error/5 p-4">
              <h3 className="font-display text-base font-bold text-error mb-2">Ký Sinh</h3>
              <div className="space-y-1 text-sm font-mono">
                <p><span className="text-gray-400">Loại:</span> <span className="text-error/80">{character.parasiteType}</span></p>
                {character.wrathStacks !== undefined && character.wrathStacks > 0 && (
                  <p><span className="text-gray-400">Stack Wrath:</span> <span className="text-error/80">{character.wrathStacks}</span>
                    <span className="text-gray-600 ml-2">(+{character.wrathStacks} STR/BIQ/MA)</span></p>
                )}
                {character.parasiteName && (
                  <p><span className="text-gray-400">Parasite:</span> <span className="text-error/80">{character.parasiteName}</span></p>
                )}
              </div>
            </section>
          )}

          {/* Stats */}
          <section>
            <div className="flex items-baseline gap-3 mb-4">
              <h3 className="font-display text-lg font-bold text-white">Stats</h3>
              <span className="font-mono text-xs text-gray-500">
                Base <span className="text-gray-300">{baseTotal}</span>
                <span className="mx-1 text-outline">→</span>
                Total <span className="text-primary">{totalPower}</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "STR", base: character.stats.str, total: characterEffects.totalStats.strength, color: "var(--color-error)" },
                { label: "SPD", base: character.stats.spd, total: characterEffects.totalStats.speed, color: "var(--color-primary)" },
                { label: "DUR", base: character.stats.dur, total: characterEffects.totalStats.durability, color: "#4ade80" },
                { label: "IQ",  base: character.stats.iq,  total: characterEffects.totalStats.iq,  color: "#60a5fa" },
                { label: "BIQ", base: character.stats.biq, total: characterEffects.totalStats.biq, color: "var(--color-tertiary)" },
                { label: "MA",  base: character.stats.ma,  total: characterEffects.totalStats.ma,  color: "var(--color-secondary)" },
              ].map(s => (
                <StatBar key={s.label} label={s.label} baseValue={s.base} totalValue={s.total} max={15} accentColor={s.color} />
              ))}
            </div>
          </section>

          {/* Quirks */}
          {character.quirks && character.quirks.length > 0 && (
            <Section title="Quirks">
              <div className="flex flex-wrap gap-1.5">
                {character.quirks.map((q, i) => (
                  <span key={i} className={`px-2.5 py-0.5 text-xs border font-mono ${q.isLost ? "border-outline/20 text-gray-600 line-through" : "border-outline/30 text-gray-300"}`}>
                    {q.name}{q.isLost && <span className="text-error/60 ml-1">(đã mất)</span>}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Powers */}
          {character.powers && character.powers.length > 0 && (
            <Section title="Powers">
              <ul className="space-y-1">
                {character.powers.map((p, i) => (
                  <li key={i} className={`flex items-center gap-2 text-sm font-mono ${p.isLost ? "text-gray-600 line-through" : "text-gray-200"}`}>
                    <span className="text-secondary/40 text-xs">◈</span>
                    {p.name}{p.isLost && <span className="text-error/60 text-xs">(đã mất)</span>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Gear */}
          {character.gear && (character.gear.normalGear?.length > 0 || character.gear.legacyGear?.length > 0) && (
            <Section title="Gear">
              {character.gear.normalGear?.length > 0 && (
                <div className="mb-3">
                  <p className="font-mono text-[10px] text-gray-500 tracking-widest uppercase mb-1.5">Normal</p>
                  <ul className="space-y-1">
                    {character.gear.normalGear.map((g, i) => (
                      <li key={i} className={`text-sm font-mono flex gap-2 items-center ${g.isLost ? "text-gray-600 line-through" : "text-gray-200"}`}>
                        <span className="text-primary/30 text-xs">—</span>{g.name}
                        {g.isLost && <span className="text-error/60 text-xs">(đã mất)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {character.gear.legacyGear?.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] text-tertiary/50 tracking-widest uppercase mb-1.5">Legacy</p>
                  <ul className="space-y-1">
                    {character.gear.legacyGear.map((g, i) => (
                      <li key={i} className={`text-sm font-mono flex gap-2 items-center ${g.isLost ? "text-gray-600 line-through" : "text-tertiary/80"}`}>
                        <span className="text-tertiary/30 text-xs">◆</span>{g.name}
                        {g.isLost && <span className="text-error/60 text-xs">(đã mất)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}

          {/* Weapons */}
          {character.weapons && character.weapons.length > 0 && (
            <Section title="Weapons">
              <div className="space-y-1.5">
                {character.weapons.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-mono">
                    <span className={`px-2 py-0.5 text-[10px] tracking-wider uppercase border ${
                      w.type === "Unique"  ? "border-primary/40 text-primary/80 bg-primary/8" :
                      w.type === "Legacy" ? "border-tertiary/40 text-tertiary/80 bg-tertiary/8" :
                      "border-outline/30 text-gray-400"
                    }`}>{w.type}</span>
                    <span className="text-gray-200">{w.name}</span>
                    {w.usable === false && <span className="text-error/60 text-xs">(không dùng được)</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Runes */}
          {character.runes?.runes?.length > 0 && (
            <Section title="Runes">
              <div className="flex flex-wrap gap-1.5">
                {character.runes.runes.map((r, i) => (
                  <span key={i} className={`px-2.5 py-0.5 text-xs border font-mono ${
                    r.isLost ? "border-outline/20 text-gray-600 line-through" : "border-primary/30 text-primary/80 bg-primary/8"
                  }`}>
                    {r.name}{r.isLost && <span className="text-error/60 ml-1">(đã mất)</span>}
                  </span>
                ))}
              </div>
              {character.runes.runeword && (
                <p className="mt-2 text-sm font-mono">
                  <span className="text-gray-500">Runeword:</span>{" "}
                  <span className="text-primary/80">{character.runes.runeword}</span>
                </p>
              )}
            </Section>
          )}

          {/* Char Dev */}
          {character.charDevs && character.charDevs.length > 0 && (
            <Section title="Character Development">
              <div className="space-y-1.5">
                {character.charDevs.map((d, i) => (
                  <p key={i} className={`p-2.5 text-sm border-l-2 ${
                    d.isLost
                      ? "border-outline/20 text-gray-600 bg-surface-low/50 line-through"
                      : "border-secondary/40 text-gray-200 bg-secondary/5"
                  }`}>
                    {d.name}{d.isLost && <span className="text-error/60 text-xs ml-1">(đã mất)</span>}
                  </p>
                ))}
              </div>
            </Section>
          )}

          {/* Lover */}
          {character.lover && character.lover.length > 0 && (
            <Section title="Lover">
              {character.lover.map((l, i) => (
                <p key={i} className={`text-sm font-mono ${l.isLost ? "text-gray-600 line-through" : "text-pink-400"}`}>
                  ♥ {l.name}{l.isLost && <span className="text-error/60 text-xs ml-1">(đã mất)</span>}
                </p>
              ))}
            </Section>
          )}

          {/* PvP Rewards */}
          {character.pvpRewards && character.pvpRewards.length > 0 && (
            <Section title="PvP Rewards">
              <ul className="space-y-1">
                {character.pvpRewards.map((r, i) => (
                  <li key={i} className="text-sm font-mono text-green-400 flex items-center gap-2">
                    <span className="text-green-600 text-xs">+</span>{r.description}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Section wrapper ────────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <div className="flex items-center gap-3 mb-3">
      <h3 className="font-display text-base font-bold text-gray-200">{title}</h3>
      <div className="h-px flex-1 bg-outline/20" />
    </div>
    {children}
  </section>
);

// ── StatBar ────────────────────────────────────────────────────────────────────
interface StatBarProps {
  label: string;
  baseValue: number;
  totalValue: number;
  max: number;
  accentColor: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, baseValue, totalValue, max, accentColor }) => {
  const baseW = Math.min((baseValue / max) * 100, 100);
  const totalW = Math.min((totalValue / max) * 100, 100);
  const diff = totalValue - baseValue;

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="stat-label">{label}</span>
        <span className="font-mono text-xs">
          <span className="text-gray-500">{baseValue}</span>
          <span className="text-outline mx-1">→</span>
          <span className="font-bold" style={{ color: diff > 0 ? "#4ade80" : diff < 0 ? "var(--color-error)" : "rgba(255,255,255,0.8)" }}>
            {totalValue}
          </span>
          {diff !== 0 && (
            <span className="ml-1 text-[10px]" style={{ color: diff > 0 ? "#4ade80" : "var(--color-error)" }}>
              ({diff > 0 ? "+" : ""}{diff})
            </span>
          )}
        </span>
      </div>
      <div className="w-full h-1.5 bg-surface-low relative overflow-hidden">
        {/* base */}
        <div className="absolute top-0 left-0 h-full opacity-25 transition-all duration-300"
          style={{ width: `${baseW}%`, background: accentColor }} />
        {/* total */}
        <div className="absolute top-0 left-0 h-full transition-all duration-500"
          style={{ width: `${totalW}%`, background: accentColor }} />
      </div>
    </div>
  );
};
