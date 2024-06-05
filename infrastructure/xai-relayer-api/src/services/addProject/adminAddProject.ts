import { IProject } from "@/models/project.schema";

type ProjectAdd = {
    relayerId: string;
    name: string;
    forwarderAddress: string;
    backendWallet: string;
    projectLimit: number;
    refillInterval: number;
    userLimit: number;
    userRefillInterval: number;
}

/**
 * ## Add a project to the database as an admin.
 * @param {Object} properties Object including the following fields:
 * @param {string} relayerId Relayer ID of the project
 * @param {string} name Name of the project
 * @param {string} forwarderAddress Forwarder contract address
 * @param {string} backendWallet Backend wallet address that funds the transactions
 * @param {number} projectLimit Periodic limit for this project
 * @param {number} refillInterval Interval in which the project limit gets refilled
 * @param {number} userLimit Periodic limit for each user in this project
 * @param {number} userRefillInterval Interval in which the user limit gets refilled
 */
export async function adminAddProject(
    properties: ProjectAdd
): Promise<void> {

    throw new Error('not implemented');

    // projectBalance = projectLimit

    // projectExists = call db check if project with relayerId exists

    // if projectExists:
        // throw exception

    // add project to db
}
