import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cx = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** shadcn/ui 컴포넌트가 가져다 쓰는 이름. */
export const cn = cx;
