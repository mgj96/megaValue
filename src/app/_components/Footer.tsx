"use client";

import { Tab, Tabs } from "@heroui/react";
import { Link } from "@heroui/react";
import NextLink from "next/link";

import { GithubMark } from "~/shared/assets/images";
import { Button } from "~/shared/ui";

export const Footer = () => {
  return (
    <footer className="mx-auto my-8 flex w-full max-w-2xl flex-col items-center gap-2 px-4">
      <Tabs
        aria-label="Footer sections"
        classNames={{
          base: "w-full",
          tabList: "w-full justify-center",
          panel: "w-full pt-1",
        }}
      >
        <Tab key="about" title="About">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-sm text-default-600 leading-tight">
              AI-driven design.
            </p>
            <p className="text-sm text-default-500 leading-tight">
              If something goes wrong, blame the AI.
            </p>
            <p className="text-sm text-default-500 leading-tight">
              Contact:{" "}
              <a
                href="https://github.com/mgj96"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                mgj96@github.com
              </a>
            </p>
            <Button
              size="lg"
              color="primary"
              className="font-semibold"
              as={Link}
              href="https://open.kakao.com/o/s7bImoqh"
              target="_blank"
              rel="noreferrer"
            >
              제작자에게 커피 사주기
            </Button>
            <Link target="_blank" href="https://github.com/mgj96/megaValue">
              <GithubMark className="size-10 fill-gray-600" />
            </Link>
          </div>
        </Tab>
        <Tab key="license" title="Open Source License">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-sm text-default-500 leading-tight">
              Copyright 2022~ mesulive. All rights reserved.
              <br />
              mesulive is not associated with NEXON Korea.
              <br />
              Contact:{" "}
              <a
                href="https://github.com/mgj96"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                mgj96@github.com
              </a>
            </p>
            <Button as={NextLink} href="/license" color="primary" variant="flat">
              License (라이센스 보기)
            </Button>
          </div>
        </Tab>
      </Tabs>
    </footer>
  );
};
