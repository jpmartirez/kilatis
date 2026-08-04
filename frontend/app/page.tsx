/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { HeaderLeft } from "@/components/landing/header-left";
import { HeaderRight } from "@/components/landing/header-right";
import { SystemInfoPanel } from "@/components/landing/system-info-panel";
import { LoginPanel } from "@/components/landing/login-panel";

export default function LandingPage() {
	const router = useRouter();
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem("token");
		const storedUser = localStorage.getItem("user");

		if (token && storedUser) {
			try {
				const user = JSON.parse(storedUser);
				if (user.role === "admin") {
					router.replace("/admin");
					return;
				} else if (user.role === "investigator") {
					router.replace("/main");
					return;
				}
			} catch {
				// Invalid json, clear storage and cookies
				localStorage.removeItem("token");
				localStorage.removeItem("user");
				document.cookie =
					"auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
				document.cookie =
					"user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
			}
		}
		setIsCheckingAuth(false);
	}, [router]);

	if (isCheckingAuth) {
		return (
			<div className="min-h-screen w-full bg-[#edf2f7] flex flex-col items-center justify-center font-sans text-slate-700">
				<div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg border border-slate-200">
					<Loader2 className="w-5 h-5 animate-spin text-slate-900" />
					<span className="text-sm font-bold tracking-wide uppercase">
						Checking Authentication...
					</span>
				</div>
			</div>
		);
	}

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
