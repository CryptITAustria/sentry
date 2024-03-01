import {getProvider, retry} from "../utils/index.js";
import {ethers} from "ethers";
import {config} from "../config.js";
import {RefereeAbi} from "../abis/index.js";

/**
 * Fetches the challengeCount.
 * @returns The count of challenges.
 */
export async function getChallengeCount(): Promise<number> {

	// Get the provider
	const provider = getProvider();

	// Create an instance of the Referee contract
	const refereeContract = new ethers.Contract(config.refereeAddress, RefereeAbi, provider);

	// Get the count of challenges
	const challengeCount: bigint = (await refereeContract.challengeCounter())
	return Number(challengeCount);
}
