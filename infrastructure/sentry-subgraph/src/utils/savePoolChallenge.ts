import { Challenge, PoolChallenge, PoolInfo, Submission } from "../../generated/schema";

/**
 * Pass in the challenge entity, submission entity, and poolInfo entity this function will create a new PoolChallenge entity
 * and update the pool challenge entity with the new data.
 * @param challenge - The challenge entity
 * @param submission - The submission entity
 * @param poolInfo - The poolInfo entity
 */
export function savePoolChallenge(challenge: Challenge, submission: Submission, poolInfo: PoolInfo): PoolChallenge {

    const poolChallenge = new PoolChallenge(poolInfo.id + "-" + challenge.id);
    poolChallenge.challenge = challenge.id;
    poolChallenge.pool = poolInfo.id;
    poolChallenge.totalClaimedEsXaiAmount = submission.claimAmount;
    poolChallenge.totalStakedEsXaiAmount = poolInfo.totalStakedEsXaiAmount;
    poolChallenge.totalStakedKeyAmount = poolInfo.totalStakedKeyAmount;
    poolChallenge.assertionTimestamp = challenge.assertionTimestamp;
    poolChallenge.save();

    return poolChallenge;
}

