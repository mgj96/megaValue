import { type Equip } from "~/entities/equip";

export const ALL_STAT_OPTIONS = [
  "STR",
  "DEX",
  "INT",
  "LUK",
  "올스탯",
  "최대 HP",
  "공격력",
  "마력",
  "보스 몬스터 공격 시 데미지",
  "방어율 무시",
  "크리티컬 데미지",
  "스킬 재사용 대기시간 감소 (초)",
  "데미지",
] as const;

export type StatOption = (typeof ALL_STAT_OPTIONS)[number] | "";

const BASE_OPTIONS: StatOption[] = ["STR", "DEX", "INT", "LUK", "올스탯", "최대 HP"];

export function getAvailableStatOptions(equip: Equip, isAddi: boolean): StatOption[] {
  // 무기 / 보조무기 / 방패
  if (
    [
      "무기",
      "보조무기(포스실드, 소울링 제외)",
      "포스실드, 소울링",
      "방패",
    ].includes(equip)
  ) {
    return [
      ...BASE_OPTIONS,
      "공격력",
      "마력",
      "데미지",
      "보스 몬스터 공격 시 데미지",
      "방어율 무시",
    ];
  }
  // 엠블렘
  if (equip === "엠블렘") {
    return [...BASE_OPTIONS, "공격력", "마력", "데미지", "방어율 무시"];
  }
  // 장갑
  if (equip === "장갑") {
    if (isAddi) {
      return [...BASE_OPTIONS, "크리티컬 데미지", "공격력", "마력"];
    }
    return [...BASE_OPTIONS, "크리티컬 데미지"];
  }
  // 모자
  if (equip === "모자") {
    if (isAddi) {
      return [...BASE_OPTIONS, "스킬 재사용 대기시간 감소 (초)", "공격력", "마력"];
    }
    return [...BASE_OPTIONS, "스킬 재사용 대기시간 감소 (초)"];
  }

  // 그 외 일반 방어구 및 장신구
  if (isAddi) {
    return [...BASE_OPTIONS, "공격력", "마력"];
  }
  return [...BASE_OPTIONS];
}
