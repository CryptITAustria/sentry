
/**
 * ## Get a quote for a project.
 * @param {string} relayerId Relayer ID of the project
 * 
 * @returns An object containing quota, nextRefill, and nextRefillAmount for the provided project.
 */
export async function getProjectQuota(relayerId: string): Promise<{ quota: number, nextRefill: number, nextRefillAmount: number }> {

    throw new Error('not implemented');

    // get Project from db: (projectBalance, lastRefill, projectLimit, refillInterval)

    // timeFromLastRefill = Date.now() - lastRefill

    // if timeFromLastRefill > refillInterval:
        // difference = refillInterval % timeFromLastRefill

        // nextRefill = Date.now() + (refillInterval - difference)

        // quota = projectLimit

        // nextRefillAmount = 0

    // else:
        // quota = projectBalance
        
        // nextRefill = Date.now() + (refillInterval - timeFromLastRefill)

        // nextRefillAmount = projectLimit - projectBalance
}
