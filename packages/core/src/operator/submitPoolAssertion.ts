import { ethers } from 'ethers';
import { RefereeAbi } from '../abis/index.js';
import { config } from '../config.js';
import { retry } from '../index.js';

/**
 * Submits an assertion to the Referee contract for multiple keys.
 * @param poolAddress The address of the pool contract.
 * @param challengeId The ID of the challenge.
 * @param successorConfirmData The confirmation data of the successor.
 * @param signer The signer to use for submitting the assertion.
 * @param logger A logger function to use for logging messages.
 */
export async function submitPoolAssertion(
    poolAddress: string,
    challengeId: bigint,
    successorConfirmData: string,
    signer: ethers.Signer,
    logger: (message: string) => void
): Promise<void> {

    // Create an instance of the Referee contract
    const refereeContract = new ethers.Contract(config.refereeAddress, RefereeAbi, signer);

    // Submit the assertion to the Referee contract
    await retry(() => refereeContract.submitPoolAssertion(
        poolAddress,
        challengeId,
        successorConfirmData
    ), 3)
        .then(() => {
            logger(`Submitted pool assertion for challenge ${challengeId.toString()} for pool ${poolAddress}.`);
        })
        .catch((error) => {
            logger(`Error on batch assertion for challenge ${challengeId.toString()} for pool ${poolAddress} ${error}`);
        })

}
