import { SentryKey, PoolChallenges} from "../../generated/schema";
import { BigInt, Bytes, Address, log } from "@graphprotocol/graph-ts"
/**
 * Pass in a challenge Id, sentryKey, rewardAmount and tx hash. This function will lookup all necessary data from the pool challenges
 * and update the pool challenges entity with the new data.
 * 
 */

// eslint-disable-next-line @typescript-eslint/ban-types
export function updatePoolChallengeOnClaim(challengeId: BigInt, sentryKey: SentryKey, rewardAmount: BigInt, transactionHash: Bytes): void {
           //Check if claiming key was part of a pool
        if (sentryKey.assignedPool.toHexString() != new Address(0).toHexString()) {
          //Load the Pool Challenges entity
          const poolChallenges = PoolChallenges.load(sentryKey.assignedPool.toHexString() + "_" + challengeId.toString());
          //Return warning if null
          if (poolChallenges == null) {
            log.warning("Failed to find poolChallenges handleRewardsClaimed: keyID: " + sentryKey.id.toString() + ", challengeId: " + challengeId.toString() + ", TX: " + transactionHash.toHexString(),[]);
            return;
          }
          //Increment key count and esXai amount claimed
          poolChallenges.claimKeyCount = poolChallenges.claimKeyCount.plus(BigInt.fromI32(1));
          poolChallenges.totalClaimedEsXaiAmount = poolChallenges.totalClaimedEsXaiAmount.plus(rewardAmount);
          poolChallenges.save();
          return;
        }
    }