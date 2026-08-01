import React from "react";
import { HeaderLeft } from "@/components/landing/header-left";
import { HeaderRight } from "@/components/landing/header-right";
import { SystemInfoPanel } from "@/components/landing/system-info-panel";
import { LoginPanel } from "@/components/landing/login-panel";

export default function LandingPage() {
	return (
		<main className="min-h-screen lg:h-screen w-full lg:w-screen overflow-y-auto lg:overflow-hidden bg-[#edf2f7] p-4 sm:p-5 lg:p-5 flex flex-col justify-between font-sans selection:bg-slate-800 selection:text-white">
			<div className="max-w-350 w-full mx-auto flex flex-col gap-4 lg:gap-4 h-full">
				{/* Top Header Row */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 shrink-0">
					<HeaderLeft />
					<HeaderRight />
				</div>

				{/* Main 2-Side Panel Content */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-4 items-stretch flex-1 lg:min-h-0">
					<SystemInfoPanel />
					<LoginPanel />
				</div>
			</div>
		</main>
	);
}
