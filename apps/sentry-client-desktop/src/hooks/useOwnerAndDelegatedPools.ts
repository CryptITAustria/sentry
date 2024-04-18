import { getOwnerOrDelegatePools } from "@sentry/core";
import { useEffect, useState } from "react";

export function useOwnerAndDelegatedPools(operatorAddress: string | undefined, initialLoadingState = false, refresh = 0) {
    const [loading, setLoading] = useState(initialLoadingState);
	const [pools, setPools] = useState<string[]>([]);

	useEffect(() => {
		setPools([]);
	}, [refresh]);

	useEffect(() => {
		if (operatorAddress) {
			void getPools(operatorAddress);
		}
	}, [operatorAddress, refresh]);

	async function getPools(_operatorAddress: string) {
		setLoading(true);
		setPools(await getOwnerOrDelegatePools(_operatorAddress));
		setLoading(false);
	}

	return {
		isLoading: loading,
		pools: pools,
	}
}
