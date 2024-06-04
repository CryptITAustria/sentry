
/**
 * ## Refill the user balance and update the lastRefill for a user in a project.
 * @param {string} walletAddress wallet Address of the user
 * @param {string} relayerId Relayer ID of the project
 * 
 */

export async function refillUser(walletAddress: string, relayerId: string): Promise<void> {

    throw new Error('not implemented');

    // get userProjectInfo from db (populate project: userLimit, userRefillInterval)

    // check user exists for this project

    // Check if refill is needed
    // timeFromLastRefill = Date.now() - lastRefill
    // if timeFromLastRefill > refillInterval:
        // updatedProjectBalance = projectLimit
        // newLastRefill = Date.now()

    // if update
        // update db with new balance and new lastRefill
}
