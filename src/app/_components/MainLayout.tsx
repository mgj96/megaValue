"use client";

import type { ReactNode } from "react";

import { cx } from "~/shared/style";

import { Footer } from "./Footer";

interface Props {
  children?: ReactNode;
  disableFooter?: boolean;
}

export const MainLayout = ({ children, disableFooter }: Props) => {
  return (
    <div className="flex h-screen max-h-screen flex-col">
      <div className="relative flex h-0 flex-1 min-h-0">
        <div className="h-full flex-1 overflow-y-auto bg-default-50">
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
