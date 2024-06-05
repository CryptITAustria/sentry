import ProjectModel, { IProject } from "@/models/project.schema";

export type Quota = {
    balance: number;
    nextRefill: number;
    nextRefillAmount: number;
    lastRefill: Date | null;
}

/**
 * ## Get a quote for a project.
 * @param {string} relayerId Relayer ID of the project
 * 
 * @returns An object containing balance, nextRefill, nextRefillAmount, refillAvailable, and lastRefill for the provided project.
 */
export async function getProjectQuota(relayerId: string): Promise<Quota> {

    const project = await ProjectModel.findOne({ relayerId: relayerId })
        .select('lastRefill refillInterval projectLimit projectBalance')
        .exec() as IProject;

    if (!project) {
        throw new Error(`Project with relayerId "${relayerId}" cannot be found.`);
    }

    const lastRefill = project.lastRefill.getTime();

    const timeFromLastRefill = Date.now() - lastRefill;
    const passedRefillIntervals = Math.ceil(timeFromLastRefill / project.refillInterval);
    const nextRefill = lastRefill + ((passedRefillIntervals + 1) * project.refillInterval);

    const refillAvailable = timeFromLastRefill > project.refillInterval;

    let projectQuota: Quota = {
        balance: project.projectBalance,
        nextRefill: nextRefill,
        nextRefillAmount: project.projectLimit - project.projectBalance,
        lastRefill: null
    }

    if (refillAvailable) {
        const newLastRefill = lastRefill + (passedRefillIntervals) * project.refillInterval;

        projectQuota.balance = project.projectLimit;
        projectQuota.nextRefillAmount = 0;
        projectQuota.lastRefill = new Date(newLastRefill);
    }

    return projectQuota;
}
