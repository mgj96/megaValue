import { AimStatInput } from "./AimStatInput";
import { EquipLevelInput } from "./EquipLevelInput";
import { EquipTypeSelect } from "./EquipTypeSelect";
import { IsBossDropCheckbox } from "./IsBossDropCheckbox";
import { OpenStatEfficiencyModalButton } from "./OpenStatEfficiencyModalButton";
import { OpenStatSimulationModalButton } from "./OpenStatSimulationModalButton";
import { WeaponGradeSelect } from "./WeaponGradeSelect";

export const SettingSectionContent = ({
  hideEquipType = false,
  hideEquipLevel = false,
}: {
  hideEquipType?: boolean;
  hideEquipLevel?: boolean;
}) => {
  return (
    <>
      <div className="grid grid-cols-2 justify-items-stretch gap-4 last:odd:*:col-span-2">
        {!hideEquipType && <EquipTypeSelect />}
        <IsBossDropCheckbox />
        {!hideEquipLevel && <EquipLevelInput />}
        <WeaponGradeSelect />
        <AimStatInput />
      </div>
      <div className="flex flex-col gap-4">
        <OpenStatEfficiencyModalButton />
        <OpenStatSimulationModalButton />
      </div>
    </>
  );
};
