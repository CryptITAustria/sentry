import ProjectModel, { IProject } from "@/models/project.schema";

/**
 * ## Refill the project balance and update the lastRefill for a project.
 * @param {string} relayerId Relayer ID of the project
 */
export async function refillProject(relayerId: string): Promise<void> {

    const project = await ProjectModel.findOne({ relayerId: relayerId })
        .exec() as IProject;

    if (!project) {
        throw new Error(`Project with relayerId "${relayerId}" cannot be found.`);
    }

    const lastRefill = project.lastRefill.getTime();
    const timeFromLastRefill = Date.now() - lastRefill;

    if (project.refillInterval > timeFromLastRefill) {
        return;
    }

    const passedRefillIntervals = Math.floor(timeFromLastRefill / project.refillInterval);
    const newLastRefill = lastRefill + (passedRefillIntervals * project.refillInterval);

    return;

    ProjectModel.findOneAndUpdate(
        { relayerId: relayerId },
        {
            $set: {
                lastRefill: new Date(newLastRefill),
                projectBalance: project.projectLimit,
                updatedAt: new Date(Date.now())
            }
        }
    );
}
