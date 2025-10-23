import React from "react";
import IconSrc from "./notai-icon.svg?url";

type Props = {
  compact?: boolean;        // true => kun ikon
  className?: string;
  to?: string;
};

export default function Logo({ compact = false, className = "", to = "/" }: Props) {
  return (
    <a href={to} aria-label="Notai" className={`flex items-center gap-2 no-underline select-none ${className}`}>
      <img src={IconSrc} alt="Notai logo" className="h-7 w-7" />
      {!compact && (
        <span className="text-[18px] font-semibold tracking-tight text-gray-900 dark:text-white">
          notai
        </span>
      )}
    </a>
  );
}
