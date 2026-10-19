"use client";

import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { GithubMark } from "~/shared/assets/images";

export const Footer = () => {
  return (
    <footer className="mx-auto my-8 flex w-full max-w-2xl flex-col items-center gap-2 px-4">
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="license">Open Source License</TabsTrigger>
        </TabsList>
        <TabsContent value="about">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-sm text-muted-foreground leading-tight">
              AI-driven design.
            </p>
            <p className="text-sm text-muted-foreground leading-tight">
              If something goes wrong, blame the AI.
            </p>
            <p className="text-sm text-muted-foreground leading-tight">
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
            <Button size="lg" asChild>
              <a
                href="https://open.kakao.com/o/s7bImoqh"
                target="_blank"
                rel="noreferrer"
              >
                제작자에게 커피 사주기
              </a>
            </Button>
            <Link target="_blank" href="https://github.com/mgj96/megaValue">
              <GithubMark className="size-10 fill-muted-foreground" />
            </Link>
          </div>
        </TabsContent>
        <TabsContent value="license">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-sm text-muted-foreground leading-tight">
              Copyright 2022~ mesulive. All rights reserved.
              <br />
              Modified by mgj96, 2026 (AGPL-3.0).
              <br />
              Data based on NEXON Open API.
              <br />
              This service is not associated with NEXON Korea.
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
            <Button variant="secondary" asChild>
              <Link href="/license">License (라이센스 보기)</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </footer>
  );
};
