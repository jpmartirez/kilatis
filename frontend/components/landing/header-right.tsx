import React from "react";
import Image from "next/image";

export const HeaderRight = () => {
  return (
    <header className="bg-[#e4ebf3] rounded-2xl px-5 py-3 lg:py-2.5 flex items-center justify-between shadow-xs border border-slate-200/50">
      <div className="flex items-center gap-3">
        {/* Logos container */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 lg:w-9 lg:h-9 transition-transform hover:scale-105">
            <Image
              src="/cybercrime-logo.png"
              alt="Anti-Cybercrime Group Logo"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 lg:w-9 lg:h-9 transition-transform hover:scale-105">
            <Image
              src="/pnp-logo.png"
              alt="Philippine National Police Logo"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Text details */}
        <div className="flex flex-col">
          <h2 className="text-sm sm:text-base lg:text-lg font-extrabold tracking-wide text-slate-900 leading-tight">
            ANTI-CYBERCRIME GROUP
          </h2>
          <p className="text-[10px] sm:text-xs lg:text-xs font-semibold tracking-wider text-slate-600 uppercase">
            PHILIPPINE NATIONAL POLICE
          </p>
        </div>
      </div>
    </header>
  );
};
