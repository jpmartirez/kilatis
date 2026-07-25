import React from "react";

export const HeaderLeft = () => {
  return (
    <header className="bg-[#e4ebf3] rounded-2xl px-5 py-3.5 flex items-center shadow-xs border border-slate-200/50">
      <div className="flex items-center gap-3">
        {/* Placeholder Kilatis Logo */}
        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center shrink-0 shadow-inner">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-400/60" />
        </div>
        
        {/* Title */}
        <h1 className="text-xl lg:text-2xl font-black tracking-wider text-slate-900 uppercase">
          KILATIS
        </h1>
      </div>
    </header>
  );
};
