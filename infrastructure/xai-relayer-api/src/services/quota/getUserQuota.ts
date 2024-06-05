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

    const userProjectInfos = await UserProjectInfoModel.find({ walletAddress: walletAddress, project: project._id })
        .select('project lastRefill balance')
        .populate({
            path: 'project',
            select: 'userLimit userRefillInterval'
        })
        .exec() as IUserProjectInfo[];

    if (!userProjectInfos || userProjectInfos.length !== 1) {
        throw new Error(`UserProjectInfo with walletAddress "${walletAddress}" for project with relayerId "${relayerId}" cannot be found or multiple found.`);
    }

    const userProjectInfo = userProjectInfos[0];

    const lastRefill = userProjectInfo.lastRefill.getTime();
    const userRefillInterval = userProjectInfo.project.userRefillInterval;

    const timeFromLastRefill = Date.now() - lastRefill;
    const passedRefillIntervals = Math.ceil(timeFromLastRefill / userRefillInterval);
    const nextRefill = lastRefill + ((passedRefillIntervals + 1) * userRefillInterval);

    const refillAvailable = timeFromLastRefill > userRefillInterval;

    if (refillAvailable) {
        const newLastRefill = lastRefill + (passedRefillIntervals * userRefillInterval);

        return {
            balance: userProjectInfo.project.userLimit,
            nextRefill: nextRefill,
            nextRefillAmount: 0,
            refillAvailable: refillAvailable,
            lastRefill: new Date(newLastRefill)
        };

    } else {
        return {
            balance: userProjectInfo.balance,
            nextRefill: nextRefill,
            nextRefillAmount: userProjectInfo.project.userLimit - userProjectInfo.balance,
            refillAvailable: refillAvailable,
            lastRefill: null
        };
    }
}
