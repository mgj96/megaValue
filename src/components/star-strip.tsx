import { cn } from "~/shared/style";

/** 강화 단계를 별 칸으로 보여 준다. 채워진 칸은 순서대로 켜진다. */
export const StarStrip = ({ star, max }: { star: number; max: number }) => (
  <div
    role="img"
    aria-label={`${max}성 중 ${star}성`}
    className="grid gap-1"
    style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
  >
    {Array.from({ length: max }, (_, index) => (
      <span
        key={index}
        className={cn(
          "h-3 rounded-[3px] transition-all duration-300",
          index < star ? "scale-100 bg-yellow-400" : "scale-90 bg-muted",
        )}
        style={{ transitionDelay: index < star ? `${Math.min(index, 14) * 12}ms` : "0ms" }}
      />
    ))}
  </div>
);
