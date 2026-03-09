"use client";

import { useMolecule } from "bunshi/react";
import { useSetAtom } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { Button } from "~/shared/ui";

interface Props {
  onInjected?: () => void;
}

export const TestValueInjector = ({ onInjected }: Props) => {
  const {
    levelAtom,
    equipPartAtom,
    sfSpareCostAtom,
    sfCurrentStarAtom,
    sfTargetStarAtom,
    sfStarcatchRecordAtom,
    scrollTypeAtom,
    potTypeAtom,
    potTargetGradeAtom,
    potResetMethodAtom,
    potCubePriceAtom,
  } = useMolecule(ItemScouterMolecule);

  const setLevel = useSetAtom(levelAtom);
  const setEquipPart = useSetAtom(equipPartAtom);
  const setSfSpareCost = useSetAtom(sfSpareCostAtom);
  const setSfCurrentStar = useSetAtom(sfCurrentStarAtom);
  const setSfTargetStar = useSetAtom(sfTargetStarAtom);
  const setSfStarcatchRecord = useSetAtom(sfStarcatchRecordAtom);
  const setScrollType = useSetAtom(scrollTypeAtom);
  const setPotType = useSetAtom(potTypeAtom);
  const setPotTargetGrade = useSetAtom(potTargetGradeAtom);
  const setPotResetMethod = useSetAtom(potResetMethodAtom);
  const setPotCubePrice = useSetAtom(potCubePriceAtom);

  const injectTestValues = () => {
    // 1. 기본 설정
    setLevel("250");
    setEquipPart("상의");
    setSfSpareCost("200000000"); // 2억

    // 2. 스타포스
    setSfCurrentStar("0");
    setSfTargetStar("21");
    // 스타캐치 일괄 활성화 (0~20성)
    const allStarcatch = Array.from({ length: 30 }).reduce<{ [key: string]: boolean }>(
      (acc, _, i) => ({ ...acc, [i]: true }),
      {},
    );
    // Note: Atom expecting string keys for record
    setSfStarcatchRecord(allStarcatch as any);

    // 3. 주문서
    setScrollType("15%");

    // 4. 잠재능력
    setPotType("COMMON");
    setPotTargetGrade("LEGENDARY");
    setPotResetMethod("POTENTIAL");
    setPotCubePrice("45000000"); // 4500만

    onInjected?.();
  };

  return (
    <Button
      size="sm"
      variant="flat"
      color="secondary"
      onPress={injectTestValues}
    >
      테스트 값 주입
    </Button>
  );
};
