import { type HTMLAttributes, type ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/shared/style";

/** 제목이 있는 섹션 카드. 화면 곳곳에서 쓰는 기본 단위. */
export const SectionContainer = ({
  title,
  className,
  children,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, "title"> & { title?: ReactNode }) => (
  <Card
    className={cn("animate-in fade-in-0 slide-in-from-bottom-2 duration-500", className)}
    {...props}
  >
    {title && (
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
    )}
    <CardContent className={cn("pt-6", title && "pt-0")}>{children}</CardContent>
  </Card>
);
