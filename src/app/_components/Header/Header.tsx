import { Link, Navbar } from "@heroui/react";
import NextLink from "next/link";
import { type RefObject } from "react";

import Image from "next/image";
import { cx } from "~/shared/style";

interface Props {
  parentRef: RefObject<HTMLElement>;
}

export const Header = ({ parentRef }: Props) => {
  return (
    <Navbar
      classNames={{
        base: cx("justify-start border-b-1 border-b-default-100 p-4"),
        wrapper: cx("h-fit justify-start gap-0 p-0"),
      }}
      shouldHideOnScroll
      parentRef={parentRef}
    >
      <Link as={NextLink} prefetch={false} href="/" className="ml-2 flex items-center gap-2">
        <Image src="/logo.png" alt="Maple Upgrade Companion" width={200} height={40} className="h-8 md:h-10 w-auto object-contain" />
      </Link>
    </Navbar>
  );
};
