import { ethers } from 'ethers';
import { RefereeAbi } from '../abis/index.js';
import { config } from '../config.js';
import { retry } from '../index.js';

/** 
 * @notice This function is used to claim the rewards for a pool submission.
 * @param {string} poolAddress - The address of the pool.
 * @param {bigint} challengeId - The ID of the challenge.
 * @param {ethers.Signer} signer - The signer to interact with the contract.
 * @param {function} logger - The logger function.
 */

export async function claimPoolSubmissionRewards(
    poolAddress: string,
    challengeId: bigint,
    signer: ethers.Signer,
    logger: (message: string) => void
): Promise<void> {

    // Create an instance of the Referee contract
    const refereeContract = new ethers.Contract(config.refereeAddress, RefereeAbi, signer);
    
    // Submit the pool assertion to the Referee contract
    await retry(() => refereeContract.claimPoolSubmissionRewards(
        poolAddress,
        challengeId
    ), 3)
        .then(() => {
            logger(`Submitted pool claim for challenge ${challengeId.toString()} for pool ${poolAddress}`);
        })
        .catch((error) => {
            logger(`Error on pool claim for challenge ${challengeId.toString()} for pool ${poolAddress}`);
        })
    
}
