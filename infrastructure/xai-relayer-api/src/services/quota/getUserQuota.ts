import UserProjectInfoModel, { IUserProjectInfo } from "@/models/userProjectInfo.schema";
import { Quota } from "./getProjectQuota";
import ProjectModel from "@/models/project.schema";
import { ObjectId } from "mongoose";

/**
 * ## Get a quote for a user in a project.
 * @param {string} walletAddress User wallet address
 * @param {string} relayerId Relayer ID of the project
 * 
 * @returns An object containing quota, nextRefill, nextRefillAmount, refillAvailable, and lastRefill for the user with the provided
 *      walletAddress and the provided project.
 */
export async function getUserQuota(walletAddress: string, relayerId: string): Promise<Quota> {

    const project = await ProjectModel.findOne({ relayerId: relayerId })
        .select('_id')
        .exec() as { _id: ObjectId };

    if (!project) {
        throw new Error(`Project with relayerId "${relayerId}" cannot be found.`);
    }

    const userProjectInfo = await UserProjectInfoModel.findOne({ walletAddress: walletAddress, project: project._id })
        .select('project lastRefill balance')
        .populate({
            path: 'project',
            select: 'userLimit userRefillInterval'
        })
        .exec() as IUserProjectInfo;

    if (!userProjectInfo) {
        throw new Error(`UserProjectInfo with walletAddress "${walletAddress}" for project with relayerId "${relayerId}" cannot be found.`);
    }

    const lastRefill = userProjectInfo.lastRefill.getTime();
    const userRefillInterval = userProjectInfo.project.userRefillInterval;

    const timeFromLastRefill = Date.now() - lastRefill;
    const passedRefillIntervals = Math.ceil(timeFromLastRefill / userRefillInterval);
    const nextRefill = lastRefill + ((passedRefillIntervals + 1) * userRefillInterval);

    const refillAvailable = timeFromLastRefill > userRefillInterval;

    let userQuota: Quota = {
        balance: userProjectInfo.balance,
        nextRefill: nextRefill,
        nextRefillAmount: userProjectInfo.project.userLimit - userProjectInfo.balance,
        lastRefill: null
    }

    if (refillAvailable) {
        const newLastRefill = lastRefill + (passedRefillIntervals * userRefillInterval);

        userQuota.balance = userProjectInfo.project.userLimit;
        userQuota.nextRefillAmount = 0;
        userQuota.lastRefill = new Date(newLastRefill);
    }

    return userQuota;
}
