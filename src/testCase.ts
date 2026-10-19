import type { Equipment } from "./nexon";

const none = { grade: null, options: [null, null, null] };

/** 관리자 검수용 표본 장비. 일반 구간, 파괴 방지 구간, 최대 성, 레벨 정보 없음을 한 번에 본다. */
export const sampleEquipment: Equipment = {
  ocid: "",
  date: null,
  characterClass: "검수용",
  presetNo: 1,
  items: [
    {
      part: "무기",
      slot: "무기",
      name: "검수용 무기",
      icon: "",
      level: 200,
      starforce: 17,
      starforceScrollFlag: "미사용",
      scrollUpgradeable: 0,
      potential: { grade: "레전드리", options: ["STR +12%", "STR +9%", "보스 몬스터 데미지 +35%"] },
      additionalPotential: { grade: "유니크", options: ["공격력 +9%", "STR +9%", "STR +6%"] },
    },
    {
      part: "모자",
      slot: "모자",
      name: "검수용 모자",
      icon: "",
      level: 200,
      starforce: 22,
      starforceScrollFlag: "미사용",
      scrollUpgradeable: 0,
      potential: { grade: "유니크", options: ["STR +9%", "STR +6%", "DEX +6%"] },
      additionalPotential: none,
    },
    {
      part: "장갑",
      slot: "장갑",
      name: "검수용 장갑",
      icon: "",
      level: 140,
      starforce: 12,
      starforceScrollFlag: "미사용",
      scrollUpgradeable: 0,
      potential: { grade: "에픽", options: ["STR +6%", "DEX +3%", "LUK +3%"] },
      additionalPotential: { grade: "에픽", options: ["공격력 +6", "STR +4%", "올스탯 +2%"] },
    },
    {
      part: "신발",
      slot: "신발",
      name: "검수용 신발(최대 성)",
      icon: "",
      level: 200,
      starforce: 30,
      starforceScrollFlag: "미사용",
      scrollUpgradeable: 0,
      potential: { grade: "레전드리", options: ["STR +12%", "STR +12%", "올스탯 +9%"] },
      additionalPotential: none,
    },
    {
      part: "뱃지",
      slot: "뱃지",
      name: "검수용 뱃지(레벨 정보 없음)",
      icon: "",
      level: 0,
      starforce: 0,
      starforceScrollFlag: "미사용",
      scrollUpgradeable: 0,
      potential: none,
      additionalPotential: none,
    },
  ],
};

/** 관리자 검수용: 환경변수에 둔 명령어를 캐릭터 이름에 넣으면 넥슨 조회 없이 표본 장비를 쓴다. */
export const isAdminTestName = (characterName: string) => {
  const command = process.env.ADMIN_TEST_COMMAND?.trim();
  return !!command && characterName === command;
};
