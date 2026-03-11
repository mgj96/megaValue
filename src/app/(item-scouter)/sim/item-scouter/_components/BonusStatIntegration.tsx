import { useMolecule } from "bunshi/react";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { E } from "~/shared/fp";
import { FormPayload } from "~/shared/react";
import { SectionContainer } from "~/shared/ui";
import {
  ResultSectionContent,
  SettingSectionContent,
  StatEfficiencyModal,
  StatSimulationModal,
} from "~/app/(bonus-stat-calc)/calc/bonus-stat/_components";
import { BonusStatCalcProvider } from "~/app/(bonus-stat-calc)/calc/bonus-stat/_lib";
import { type Equip } from "~/entities/equip";
import { bonusStatCalcAtoms } from "~/app/(bonus-stat-calc)/calc/bonus-stat/_lib/atoms";
import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";

const BonusStatSync = ({
  equipPart,
  levelPayload,
}: {
  equipPart: Equip;
  levelPayload: FormPayload<number>;
}) => {
  const setBonusEquipType = useSetAtom(bonusStatCalcAtoms.equipType);
  const setBonusEquipLevel = useSetAtom(bonusStatCalcAtoms.equipLevel);

  useEffect(() => {
    // 무기류 판별 (방패/엠블렘/보조무기 포함 등 실제 필요무기 판별)
    const isWeapon = [
      "무기",
      "보조무기(포스실드, 소울링 제외)",
      "포스실드, 소울링",
      "방패",
      "엠블렘",
    ].includes(equipPart);

    setBonusEquipType(isWeapon ? "WEAPON" : "NON_WEAPON");
  }, [equipPart, setBonusEquipType]);

  useEffect(() => {
    // 글로벌 장비 레벨 동기화
    if (E.isRight(levelPayload.value)) {
      setBonusEquipLevel(levelPayload.value.right);
    } else {
      setBonusEquipLevel(undefined);
    }
  }, [levelPayload.value, setBonusEquipLevel]);

  return null;
};

export const BonusStatIntegration = () => {
  const { equipPartAtom, levelAtom } = useMolecule(ItemScouterMolecule);
  const equipPart = useAtomValue(equipPartAtom);
  const levelPayload = useAtomValue(levelAtom);

  return (
    <BonusStatCalcProvider>
      <BonusStatSync equipPart={equipPart} levelPayload={levelPayload} />
      <div className="flex flex-col gap-4">
        <SectionContainer title="추가옵션 설정">
          <SettingSectionContent hideEquipType={true} hideEquipLevel={true} />
        </SectionContainer>
        <SectionContainer title="추가옵션 기댓값 결과 (모니터링)">
          <div className="min-h-[150px]">
            <ResultSectionContent />
          </div>
        </SectionContainer>
      </div>
      <StatEfficiencyModal />
      <StatSimulationModal />
    </BonusStatCalcProvider>
  );
};
