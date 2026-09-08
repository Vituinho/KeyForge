export type TranslatorFn = (key: string, params?: Record<string, string | number>) => string

export function formatMechanicEffect(effect: string, t: TranslatorFn): string {
  // Precision penalty: PRECISION PENALTY (50% Dmg Reduced)
  const precPenalty = effect.match(/^PRECISION PENALTY \((\d+)% Dmg Reduced\)$/i)
  if (precPenalty) return t("battle.mechanics.precisionPenalty", { percent: precPenalty[1] })

  // Precision strike: PRECISION STRIKE (+20%)
  const precStrike = effect.match(/^PRECISION STRIKE \(\+(\d+)%\)$/i)
  if (precStrike) return t("battle.mechanics.precisionStrike", { percent: precStrike[1] })

  // Speed penalty: SPEED PENALTY (40% Dmg Reduced)
  const speedPenalty = effect.match(/^SPEED PENALTY \((\d+)% Dmg Reduced\)$/i)
  if (speedPenalty) return t("battle.mechanics.speedPenalty", { percent: speedPenalty[1] })

  // Consistency bonus: CONSISTENCY BONUS (+30%)
  const constBonus = effect.match(/^CONSISTENCY BONUS \(\+(\d+)%\)$/i)
  if (constBonus) return t("battle.mechanics.consistencyBonus", { percent: constBonus[1] })

  // Rhythm penalty: RHYTHM SWING PENALTY (-20%)
  const rhythmPenalty = effect.match(/^RHYTHM SWING PENALTY \(-(\d+)%\)$/i)
  if (rhythmPenalty) return t("battle.mechanics.rhythmPenalty", { percent: rhythmPenalty[1] })

  // Combo surge: COMBO SURGE (x1.5)
  const comboSurge = effect.match(/^COMBO SURGE \(x([\d.]+)\)$/i)
  if (comboSurge) return t("battle.mechanics.comboSurge", { multiplier: comboSurge[1] })

  // Countered: COUNTERED (-5 HP)
  const countered = effect.match(/^COUNTERED \(-(\d+) HP\)$/i)
  if (countered) return t("battle.mechanics.countered", { hp: countered[1] })

  // Genjutsu dispelled / trapped
  if (/^GENJUTSU DISPELLED/i.test(effect)) return t("battle.mechanics.genjutsuDispelled")
  if (/^TRAPPED IN GENJUTSU/i.test(effect)) return t("battle.mechanics.trappedGenjutsu")

  // Advanced to phase: ADVANCED TO PHASE 2
  const advPhase = effect.match(/^ADVANCED TO PHASE (\d+)$/i)
  if (advPhase) return t("battle.mechanics.advancedToPhase", { phase: advPhase[1] })

  // Rock Lee thresholds
  const eightGates = effect.match(/^EIGHT GATES SURGE \(x([\d.]+)\)$/i)
  if (eightGates) return t("battle.mechanics.eightGatesSurge", { multiplier: eightGates[1] })
  const lotus = effect.match(/^LOTUS VELOCITY \(x([\d.]+)\)$/i)
  if (lotus) return t("battle.mechanics.lotusVelocity", { multiplier: lotus[1] })
  const taijutsu = effect.match(/^TAIJUTSU CADENCE/i)
  if (taijutsu) return t("battle.mechanics.taijutsuCadence", { multiplier: "1.0" })

  // Sasuke combo tiers
  if (/^KIRIN COMBO/i.test(effect)) return t("battle.mechanics.kirinCombo")
  if (/^CHIDORI COMBO/i.test(effect)) return t("battle.mechanics.chidoriCombo")
  if (/^SHARINGAN FLOW/i.test(effect)) return t("battle.mechanics.sharinganFlow")

  return effect
}

export function formatPhaseName(phaseName: string, t: TranslatorFn): string {
  if (/Asura & Human/i.test(phaseName)) return t("battle.mechanics.phaseNames.pain1")
  if (/Animal & Naraka/i.test(phaseName)) return t("battle.mechanics.phaseNames.pain2")
  if (/Deva Path/i.test(phaseName)) return t("battle.mechanics.phaseNames.pain3")
  if (/Edo Tensei/i.test(phaseName)) return t("battle.mechanics.phaseNames.madara1")
  if (/Perfect Susanoo/i.test(phaseName)) return t("battle.mechanics.phaseNames.madara2")
  if (/Ten-Tails/i.test(phaseName)) return t("battle.mechanics.phaseNames.madara3")

  const generic = phaseName.match(/^Phase (\d+)/i)
  if (generic) return t("battle.mechanics.phaseNames.genericPhase", { phase: generic[1] })

  return phaseName
}
