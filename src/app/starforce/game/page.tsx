import type { Metadata } from "next";

import { GameScreen } from "./GameScreen";

export const metadata: Metadata = { title: "스타포스 키우기 | 메이플 장비 진단" };

export default function GamePage() {
  return <GameScreen />;
}
