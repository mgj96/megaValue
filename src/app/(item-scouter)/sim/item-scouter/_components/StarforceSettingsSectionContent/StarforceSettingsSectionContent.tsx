import { DiscountCheckboxGroup } from "./DiscountCheckboxGroup";
import { EventRadioGroup } from "./EventRadioGroup";
import { SafeguardButtonGroup } from "./SafeguardButtonGroup";
import { StarcatchButtonGroup } from "./StarcatchButtonGroup";

export const StarforceSettingsSectionContent = () => {
  return (
    <div className="flex flex-col gap-6">
      <SafeguardButtonGroup />
      <StarcatchButtonGroup />
      <EventRadioGroup />
      <DiscountCheckboxGroup />
    </div>
  );
};
