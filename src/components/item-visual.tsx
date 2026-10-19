import { ItemIcon } from "~/components/item-icon";
import { setById, type SlotId } from "~/items";
import { cn } from "~/shared/style";

/** 넥슨이 준 아이콘이 있으면 그것을, 없으면 세트 색의 자체 아이콘을 보여 준다. */
export const ItemVisual = ({
  icon,
  setId,
  slot,
  label,
  className,
}: {
  icon?: string | null;
  setId?: string | null;
  slot?: string | null;
  label?: string;
  className?: string;
}) => {
  if (icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt={label ?? ""}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={cn("size-full bg-muted object-contain p-1", className)}
        style={{ imageRendering: "pixelated" }}
      />
    );
  }
  const set = setId ? setById(setId) : undefined;
  return (
    <ItemIcon
      slot={(slot as SlotId | null) ?? "weapon"}
      color={set?.color ?? "#71717a"}
      label={label}
      className={cn("size-full", className)}
    />
  );
};
