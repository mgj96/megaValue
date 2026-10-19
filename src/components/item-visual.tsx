import { SLOT_NAMES, imageOf, type SlotId } from "~/items";
import { cn } from "~/shared/style";

/** 넥슨이 준 아이콘이 있으면 그것을, 없으면 부위 이름만 적은 빈 칸을 보여 준다. */
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
  const bundled = setId && slot ? imageOf(setId, slot) : undefined;
  const src = icon || bundled;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label ?? ""}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={cn("size-full bg-muted object-contain p-1", className)}
        style={{ imageRendering: "pixelated" }}
      />
    );
  }
  return (
    <div className={cn("flex size-full items-center justify-center bg-muted p-1 text-center text-[10px] leading-tight text-muted-foreground", className)}>
      {label ?? SLOT_NAMES[slot as SlotId] ?? ""}
    </div>
  );
};
