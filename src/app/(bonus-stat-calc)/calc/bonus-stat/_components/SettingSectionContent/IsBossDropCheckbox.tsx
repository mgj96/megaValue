"use client";

import { Tooltip } from "@heroui/react";
import { useAtom } from "jotai";

import { bonusStatCalcAtoms } from "~/app/(bonus-stat-calc)/calc/bonus-stat/_lib";
import { cx } from "~/shared/style";
import { Checkbox } from "~/shared/ui";

export const IsBossDropCheckbox = () => {
  const [isBossDrop, setIsBossDrop] = useAtom(bonusStatCalcAtoms.isBossDrop);

  return (
    <Tooltip
      content={
        <div className="px-1 py-1 text-xs">
          <div className="font-bold mb-1">보스 장비 (보스 드랍) 특장점</div>
          <ul className="list-disc list-inside">
            <li>추가옵션이 항상 **확정 4개** 부여됩니다. (일반 장비 1~4개)</li>
            <li>환불 사용 시 기본적으로 **추가 점수(+2단계) 가중치**를 받습니다.</li>
          </ul>
        </div>
      }
      placement="top"
    >
      <div>
        <Checkbox
          classNames={{
            base: cx("max-w-none justify-center"),
          }}
          onValueChange={setIsBossDrop}
          defaultSelected={isBossDrop}
        >
          보스 드랍
        </Checkbox>
      </div>
    </Tooltip>
  );
};
