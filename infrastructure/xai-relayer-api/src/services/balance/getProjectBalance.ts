
/**
 * ## Get the user current user balance for a user in a project.
 * @param {string} walletAddress wallet Address of the user
 * @param {string} relayerId Relayer ID of the project
 * 
 * @returns An object that contains the current user balance
 */

export async function getProjectBalance(relayerId: string): Promise<{projectBalance: number}> {

    throw new Error('not implemented');

    // get Project from db for a project
    // check Project exists

    // Info refill for project should happen in controller

    // return project balance
}
