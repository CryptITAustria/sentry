"use client";

import { useBlockIp } from "@/hooks/useBlockIp";
import { PropsWithChildren } from "react";
import { BiLoaderAlt } from "react-icons/bi";

export function IpLocationChecker({ children }: PropsWithChildren) {

    const blockUsa = true;

	const { blocked, loading } = useBlockIp({blockUsa});

	if (loading) {
		return (
			<div className="w-full h-screen flex justify-center items-center">
				<BiLoaderAlt className="animate-spin" size={32} color={"#000000"} />
			</div>
		)
	}

	if (blocked) {
		return (
			<pre className="p-2 text-sm">You are in a country restricted from using this application.</pre>
		);
	}

	return children;
}
