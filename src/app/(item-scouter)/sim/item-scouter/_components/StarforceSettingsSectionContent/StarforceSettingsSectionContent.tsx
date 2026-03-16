import { DiscountCheckboxGroup } from "./DiscountCheckboxGroup";
import { EventRadioGroup } from "./EventRadioGroup";
import { SafeguardButtonGroup } from "./SafeguardButtonGroup";

export const StarforceSettingsSectionContent = () => {
  return (
    <div className="flex flex-col gap-6">
      <SafeguardButtonGroup />
      <EventRadioGroup />
      <DiscountCheckboxGroup />
    </div>
  );
};
