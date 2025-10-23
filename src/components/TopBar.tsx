import { memo } from "react";
import Logo from "./Logo";

export default memo(function TopBar() {
  return (
    <header className="w-full bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 h-12 md:h-14 flex items-center">
        <a href="/" className="flex items-center gap-2">
          <Logo />
        </a>
      </div>
    </header>
  );
});
