
/**
 * ## Get the user current user balance for a user in a project.
 * @param {string} walletAddress wallet Address of the user
 * @param {string} relayerId Relayer ID of the project
 * 
 * @returns An object that contains the current user balance
 */

export async function getUserBalance(walletAddress: string, relayerId: string): Promise<{balance: number}> {

    throw new Error('not implemented');

    // get userProjectInfo from db for a project

    // check user exists for this project

    // Info refill should happen in controller

    // return user balance
}
