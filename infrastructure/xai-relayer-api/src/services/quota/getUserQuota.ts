
/**
 * ## Get a quote for a user in a project.
 * @param {string} walletAddress User wallet address
 * @param {string} relayerId Relayer ID of the project
 * 
 * @returns An object containing quota, nextRefill, and nextRefillAmount for the user with the provided
 *      walletAddress and the provided project.
 */
export async function getUserQuota(walletAddress: string, relayerId: string): Promise<{ quota: number, nextRefill: number, nextRefillAmount: number }> {

    throw new Error('not implemented');

    // get userProjectInfo from db (populate project: userLimit, userRefillInterval)

    // timeFromLastRefill = Date.now() - lastRefill

    // if timeFromLastRefill > userRefillInterval:
        // difference = userRefillInterval % timeFromLastRefill

        // nextRefill = Date.now() + (userRefillInterval - difference)

        // quota = userLimit

        // nextRefillAmount = 0

    // else:
        // quota = balance
        
        // nextRefill = Date.now() + (userRefillInterval - timeFromLastRefill)

        // nextRefillAmount = userLimit - balance
}
