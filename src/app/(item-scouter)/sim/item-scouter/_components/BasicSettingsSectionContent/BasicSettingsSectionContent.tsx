import { CurrentStarInput } from "./CurrentStarInput";
import { EquipLevelInput } from "./EquipLevelInput";
import { EquipTypeToggle } from "./EquipTypeToggle";
import { SpareCostInput } from "./SpareCostInput";
import { TargetStarInput } from "./TargetStarInput";

export const BasicSettingsSectionContent = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: 장비 레벨 + 장비 타입 | 장비 원가 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <EquipLevelInput />
          <EquipTypeToggle />
        </div>
        <SpareCostInput />
      </div>

      {/* Row 2: 현재 성급 + 목표 성급 */}
      <div className="grid grid-cols-2 gap-4">
        <CurrentStarInput />
        <TargetStarInput />
      </div>
    </div>
  );
};
