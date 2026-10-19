import { type ReactNode } from "react";

import { cn } from "~/shared/style";

export type EquipmentTile = {
  key: string;
  label: string;
  icon: ReactNode;
  /** 왼쪽 위에 붙는 작은 표시(예: ★17). */
  badge?: string;
  disabled?: boolean;
};

/** 게임 장비창처럼 아이콘 칸을 격자로 늘어놓고 하나를 고르게 한다. */
export const EquipmentWindow = ({
  tiles,
  selected,
  onSelect,
}: {
  tiles: EquipmentTile[];
  selected: string | null;
  onSelect: (key: string) => void;
}) => (
  <div className="grid grid-cols-4 gap-2 rounded-xl border bg-muted/40 p-3 sm:grid-cols-5">
    {tiles.map((tile) => (
      <button
        key={tile.key}
        type="button"
        disabled={tile.disabled}
        onClick={() => onSelect(tile.key)}
        aria-pressed={selected === tile.key}
        className={cn(
          "group relative flex flex-col items-center gap-1 rounded-lg border-2 border-transparent bg-background/70 p-1.5 transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-primary/40 active:scale-95 disabled:pointer-events-none disabled:opacity-40",
          selected === tile.key && "border-primary bg-accent shadow-md",
        )}
      >
        {tile.badge && (
          <span className="absolute left-1 top-1 z-10 rounded bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
            {tile.badge}
          </span>
        )}
        <span className="block aspect-square w-full overflow-hidden rounded-md">{tile.icon}</span>
        <span className="w-full truncate text-center text-[11px] text-muted-foreground group-aria-pressed:text-foreground">
          {tile.label}
        </span>
      </button>
    ))}
  </div>
);
