
/**
 * ## Add a user for a project to the database.
 * @param {string} walletAddress User wallet address
 * @param {string} relayerId Relayer ID of the project
 */
export async function addUserProjectInfo(walletAddress: string, relayerId: string): Promise<void> {

    throw new Error('not implemented');

    // project = get project with relayerId from db

    // if not project:
        // throw error

    // balance = project.userLimit

    // save project id for userProjectInfo creation

    // userProjectInfoExists = call db check if userProjectInfo with walletAddress AND projectId exists

    // if userProjectInfoExists:
        // throw exception

    // add userProjectInfo to db
}
