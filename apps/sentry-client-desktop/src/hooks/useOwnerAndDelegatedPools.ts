import { getOwnerOrDelegatePools } from "@sentry/core";
import { useEffect, useState } from "react";

export function useOwnerAndDelegatedPools(operatorAddress: string | undefined) {
	const [pools, setPools] = useState<string[]>([]);

	useEffect(() => {
		if (operatorAddress) {
			getOwnerOrDelegatePools(operatorAddress).then((pools) => {
				setPools(pools);
			})
		}
	}, [operatorAddress]);

	useEffect(() => {
		console.log(pools);
	}, [pools]);

	return { pools }
}
