import { type ReactNode } from "react";

import { SLOT_POSITIONS } from "~/items";
import { cn } from "~/shared/style";

export type EquipmentTile = {
  key: string;
  label: string;
  icon: ReactNode;
  /** 장비창 칸 이름(SLOT_POSITIONS 의 키). 없거나 표에 없으면 빈 칸에 차례로 들어간다. */
  equipSlot?: string;
  /** 왼쪽 위에 붙는 작은 표시(예: ★17). */
  badge?: string;
  disabled?: boolean;
  /** 보유하지 않은 칸은 흐리게 보인다. */
  dim?: boolean;
};

/**
 * 게임 장비창 모양. 7열 격자에서 가운데(3~5열, 1~4행)는 캐릭터 자리이고
 * 장비 칸은 SLOT_POSITIONS 대로 양옆과 아래에 놓인다.
 */
export const EquipmentWindow = ({
  tiles,
  selected,
  onSelect,
  center,
}: {
  tiles: EquipmentTile[];
  selected: string | null;
  onSelect?: (key: string) => void;
  center?: ReactNode;
}) => {
  const used = new Set(tiles.map((tile) => tile.equipSlot));
  const empty = Object.entries(SLOT_POSITIONS).filter(([name]) => !used.has(name));

  return (
  <div
    className="mx-auto grid w-full max-w-sm gap-1.5 rounded-xl border bg-muted/40 p-2 sm:gap-2 sm:p-3"
    style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gridAutoRows: "auto" }}
  >
    <div
      className="flex flex-col items-center justify-center overflow-hidden rounded-lg border bg-background/80 p-2 text-center"
      style={{ gridColumn: "3 / 6", gridRow: "1 / 5" }}
    >
      {center}
    </div>

    {empty.map(([name, [column, row]]) => (
      <div
        key={name}
        aria-hidden
        title={name}
        className="aspect-square rounded-md border border-dashed border-border bg-background/40"
        style={{ gridColumn: column, gridRow: row }}
      />
    ))}

    {tiles.map((tile) => {
      const position = tile.equipSlot ? SLOT_POSITIONS[tile.equipSlot] : undefined;
      return (
        <button
          key={tile.key}
          type="button"
          title={tile.label}
          aria-label={tile.label}
          disabled={tile.disabled || !onSelect}
          onClick={() => onSelect?.(tile.key)}
          aria-pressed={selected === tile.key}
          style={position ? { gridColumn: position[0], gridRow: position[1] } : undefined}
          className={cn(
            "relative aspect-square rounded-md border-2 border-transparent bg-background/70 p-0.5 transition-all duration-150",
            "hover:-translate-y-0.5 hover:border-primary/40 active:scale-90 disabled:hover:translate-y-0",
            selected === tile.key && "border-yellow-400 shadow-md",
          )}
        >
          {tile.badge && (
            <span className="absolute -left-1 -top-1 z-10 rounded bg-yellow-400 px-0.5 text-[9px] font-bold leading-3 text-zinc-900 sm:text-[10px] sm:leading-4">
              {tile.badge}
            </span>
          )}
          <span
            className={cn(
              "block size-full overflow-hidden rounded",
              tile.dim && "opacity-40 grayscale",
            )}
          >
            {tile.icon}
          </span>
        </button>
      );
    })}
  </div>
  );
};
