
/**
 * ## Refill the project balance and update the lastRefill for a project.
 * @param {string} relayerId Relayer ID of the project
 * 
 */

export async function refillProject(relayerId: string): Promise<void> {

    throw new Error('not implemented');

    // get Project from db: (projectBalance, lastRefill, projectLimit, refillInterval)

    // check project exists

    // Check if refill is needed
    // timeFromLastRefill = Date.now() - lastRefill
    // if timeFromLastRefill > refillInterval:
        // updatedProjectBalance = projectLimit
        // newLastRefill = Date.now()

    // if update
        // update db with new balance and new lastRefill
}

