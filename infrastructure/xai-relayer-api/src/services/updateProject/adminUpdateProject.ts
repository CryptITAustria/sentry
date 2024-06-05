
type ProjectUpdate = {
    //TODO add properties to update
}

/**
 * ## Update a project in the database as an admin.
 * @param {string} relayerId Relayer ID of the project
 * @param {string} name Name of the project
 * @param {string} forwarderAddress Forwarder contract address
 * @param {string} backendWallet Backend wallet address that funds the transactions
 * @param {number} projectLimit Periodic limit for this project
 * @param {number} refillInterval Interval in which the project limit gets refilled
 * @param {number} userLimit Periodic limit for each user in this project
 * @param {number} userRefillInterval Interval in which the user limit gets refilled
 */
export async function adminUpdateProject(
    relayerId: string,
    properties: ProjectUpdate
): Promise<void> {

    throw new Error('not implemented');

    // projectToUpdate = call db get project with relayerId

    // if not projectToUpdate:
        // throw exception

    // Check properties to update

    // save updated project to db
}
