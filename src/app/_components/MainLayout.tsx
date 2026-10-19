"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ThemeToggle } from "~/components/theme-toggle";
import { cx } from "~/shared/style";

import { Footer } from "./Footer";

const NAV = [
  { href: "/", label: "장비 진단", short: "진단" },
  { href: "/starforce/game", label: "스타포스 키우기", short: "키우기" },
  { href: "/starforce", label: "스타포스 테스트", short: "테스트" },
];

interface Props {
  children?: ReactNode;
  disableFooter?: boolean;
}

export const MainLayout = ({ children, disableFooter }: Props) => {
  const pathname = usePathname();

  return (
    <div className="flex h-screen max-h-screen flex-col">
      <div className="relative flex h-0 flex-1 min-h-0">
        <div className="h-full flex-1 overflow-y-auto bg-background">
          <div className="flex items-center justify-between gap-2 px-4 pt-3">
            <nav aria-label="주요 메뉴" className="flex flex-wrap gap-1">
              {NAV.map(({ href, label, short }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  className={cx(
                    "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
                    pathname === href ? "bg-accent text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
            </nav>
            <ThemeToggle />
          </div>
          <div className={cx("p-4")}>
            {/* <Adsense
              adSlot="6642780063"
              className="mx-auto mb-4 block h-[50px] w-[300px] md:h-[90px] md:w-[728px]"
            /> */}
            {children}
            {/* <div className="flex justify-evenly gap-4">
              <Adsense
                adSlot="9244090346"
                className="sticky top-10 hidden h-[600px] w-[160px] shrink-0 2xl:inline-block"
              />
              <main className="shrink basis-[1280px]">{children}</main>
              <Adsense
                adSlot="9244090346"
                className="sticky top-10 hidden h-[600px] w-[160px] shrink-0 2xl:inline-block"
              />
            </div> */}
            {/* <Adsense
              adSlot="6642780063"
              className="mx-auto mt-16 block w-[300px] md:w-[728px]"
              adFormat="auto"
            /> */}
          </div>
          {!disableFooter && <Footer />}
        </div>
      </div>
    </div>
  );
};
