import type { SlotId } from "~/items";
import { cn } from "~/shared/style";

/** 부위별 간단한 도형. 24x24 안에서 흰색으로 그린다. */
const GLYPHS: Record<SlotId, React.ReactNode> = {
  hat: (
    <>
      <path d="M4 15c0-5 3.5-9 8-9s8 4 8 9z" />
      <rect x="3" y="15" width="18" height="3" rx="1.5" />
    </>
  ),
  outfit: (
    <path d="M8 4l-4 3 2 4 2-1v10h8V10l2 1 2-4-4-3c-.6 1.6-2 2.5-4 2.5S8.6 5.6 8 4z" />
  ),
  gloves: (
    <path d="M8 21v-6L6 9l1.5-.5L9 11V4h2v6h1V3h2v7h1V5h2v6h1V7h2v8l-3 6z" transform="scale(.85) translate(2 1)" />
  ),
  shoes: <path d="M4 7h7v6l8 2c1 .3 1.5 1 1.5 2v1H4z" />,
  cape: <path d="M7 4h10l3 16c-2.5-1-5-1.5-8-1.5S6.500 19 4 20z" />,
  shoulder: (
    <>
      <path d="M3 17c0-6 4-10 9-10s9 4 9 10z" />
      <rect x="3" y="17" width="18" height="2.5" rx="1.2" />
    </>
  ),
  weapon: <path d="M19 3l2 2-9 9-1.500-1.500zM6 14l4 4-2 3-5-5zM4.500 17.500l2 2" />,
  ring: (
    <>
      <circle cx="12" cy="14" r="6" fill="none" stroke="white" strokeWidth="3" />
      <path d="M12 2l3 4h-6z" />
    </>
  ),
  pendant: (
    <>
      <path d="M5 4l7 9 7-9" fill="none" stroke="white" strokeWidth="2" />
      <path d="M12 13l4 4-4 5-4-5z" />
    </>
  ),
  belt: (
    <>
      <rect x="2" y="9" width="20" height="6" rx="1.500" />
      <rect x="9.500" y="7" width="5" height="10" rx="1" fill="none" stroke="white" strokeWidth="1.500" />
    </>
  ),
  earring: (
    <>
      <circle cx="12" cy="6" r="2.500" />
      <path d="M12 9v5" stroke="white" strokeWidth="2" />
      <path d="M12 13l4 4-4 5-4-5z" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12c3-5 6-7 10-7s7 2 10 7c-3 5-6 7-10 7s-7-2-10-7z" fill="none" stroke="white" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

/** 세트 색 위에 부위 도형을 얹은 아이콘. 공식 아이콘이 생기기 전까지 쓰는 자체 제작 이미지다. */
export const ItemIcon = ({
  slot,
  color,
  className,
  label,
}: {
  slot: SlotId;
  color: string;
  className?: string;
  label?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={cn("rounded-[18%]", className)}
    style={{ background: `linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 55%, #000))` }}
    fill="white"
  >
    <g transform="translate(3.600 3.600) scale(.7)">{GLYPHS[slot]}</g>
  </svg>
);
