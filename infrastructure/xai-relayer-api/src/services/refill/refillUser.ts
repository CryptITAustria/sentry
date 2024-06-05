import ProjectModel from "@/models/project.schema";
import UserProjectInfoModel, { IUserProjectInfo } from "@/models/userProjectInfo.schema";

/**
 * ## Refill the user balance and update the lastRefill for a user in a project.
 * @param {string} walletAddress wallet Address of the user
 * @param {string} relayerId Relayer ID of the project
 */
export async function refillUser(walletAddress: string, relayerId: string): Promise<void> {

    const project = await ProjectModel.findOne({ relayerId: relayerId }).select('_id').exec();
    const userProjectInfos = await UserProjectInfoModel.find({ walletAddress: walletAddress })
        .populate({
            path: 'project',
            select: 'userLimit userRefillInterval'
        })
        .exec() as IUserProjectInfo[];

    if (!userProjectInfos || userProjectInfos.length !== 1) {
        throw new Error(`UserProjectInfo with walletAddress "${walletAddress}" and relayerId "${relayerId}" cannot be found.`);
    }

    const userProjectInfo = userProjectInfos[0];

    const lastRefill = userProjectInfo.lastRefill.getTime();
    const timeFromLastRefill = Date.now() - lastRefill;
    const refillInterval = userProjectInfo.project.userRefillInterval;

    if (refillInterval > timeFromLastRefill) {
        return;
    }

    const passedRefillIntervals = Math.floor(timeFromLastRefill / refillInterval);
    const newLastRefill = lastRefill + (passedRefillIntervals * refillInterval);

    const updatedUserProjectInfo = { ...userProjectInfo }
    updatedUserProjectInfo.lastRefill = new Date(newLastRefill);
    updatedUserProjectInfo.balance = userProjectInfo.project.userLimit;
    updatedUserProjectInfo.updatedAt = new Date(Date.now());
}
