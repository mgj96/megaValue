import { Fragment } from "react";

/** 문장 속 ★ 글자를 노란색으로 칠한다. */
export const StarText = ({ children }: { children: string }) => (
  <>
    {children.split("★").map((part, index) => (
      <Fragment key={index}>
        {index > 0 && <span className="text-yellow-500 dark:text-yellow-400">★</span>}
        {part}
      </Fragment>
    ))}
  </>
);
