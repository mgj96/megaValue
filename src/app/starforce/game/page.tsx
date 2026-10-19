import { redirect } from "next/navigation";

/** 게임은 /starforce 의 "게임" 탭으로 옮겼다. 예전 주소는 그리로 보낸다. */
export default function LegacyGamePage() {
  redirect("/starforce");
}
