import React from "react";
import Image from "next/image";

export const HeaderLeft = () => {
  return (
    <header className="bg-[#e4ebf3] rounded-2xl px-5 py-3.5 flex items-center shadow-xs border border-slate-200/50">
      <div className="flex items-center gap-3">
        <Image
          src="/kilatisLogo.png"
          alt="KILATIS Logo"
          width={36}
          height={36}
          className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0"
          priority
        />
        
        <h1 className="text-xl lg:text-2xl font-black tracking-wider text-slate-900 uppercase">
          KILATIS
        </h1>
      </div>
    </header>
  );
};
