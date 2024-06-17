import { GraphQLClient, gql } from "graphql-request";
import { config } from "../config.js";
import { PoolInfo } from "@sentry/sentry-subgraph-client";

type PoolRewardRates = {
  poolAddress: string;
  averageDailyEsXaiReward: number;
  averageDailyKeyReward: number;
}

const AVERAGE_WINDOW_DAYS = 7n;
const BATCH_SIZE = 10; // Adjust batch size as necessary
const DELAY_MS = 100; // Adjust delay as necessary

/**
 * 
 * @param poolAddresses - The filter for the pool address (leave empty to get for all pools)
 * @returns List of pool reward rate objects with the pool address and average daily reward rates for esXAI and keys.
 */
export async function getRewardRatesFromGraph(
  poolAddresses: string[]
): Promise<PoolRewardRates[]> {

  const client = new GraphQLClient(config.subgraphEndpoint);

  const unixAverageWindowPlus5Mins = Number(AVERAGE_WINDOW_DAYS) * 24 * 60 * 60 * 1000 + 5 * 60 * 1000;
  const startTimestamp = Math.floor((Date.now() - unixAverageWindowPlus5Mins) / 1000);

  const query = gql`
    query PoolInfos($startTimestamp: Int!, $poolAddresses: [String!]) {
      poolInfos(first: 10000, orderBy: totalStakedEsXaiAmount, orderDirection: desc, where: {address_in: $poolAddresses}) {
        address
        keyBucketShare
        stakedBucketShare
        poolChallenges(where: {assertionTimestamp_gt: $startTimestamp}) {
          totalClaimedEsXaiAmount
          totalStakedEsXaiAmount
          totalStakedKeyAmount
        }
      }
    }
  `;

  const result = await client.request(query, { startTimestamp, poolAddresses }) as any;
  const poolInfos: PoolInfo[] = result.poolInfos;

  const poolRewardRates: PoolRewardRates[] = [];

  for (let index = 0; index < poolInfos.length; index++) {
    const poolInfo: PoolInfo = result.poolInfos[index];

    const stakedBucketShare = BigInt(poolInfo.stakedBucketShare);
    const keyBucketShare = BigInt(poolInfo.keyBucketShare);

    let totalEsXaiRewards = 0n;
    let totalKeyRewards = 0n;

    poolInfo.poolChallenges.forEach(challenge => {
      const stakedEsXaiAmountWei = BigInt(challenge.totalStakedEsXaiAmount);
      const stakedKeyAmount = BigInt(challenge.totalStakedKeyAmount);

      // esXAI
      const esXaiBucketClaimWei = (BigInt(challenge.totalClaimedEsXaiAmount) * stakedBucketShare) / 1_000_000n;
      const rewardPerStakedEsXaiWei = esXaiBucketClaimWei / (stakedEsXaiAmountWei || 1n);

      totalEsXaiRewards += rewardPerStakedEsXaiWei;

      // keys
      const keyBucketClaimWei = (BigInt(challenge.totalClaimedEsXaiAmount) * keyBucketShare) / 1_000_000n;
      const rewardPerStakedKeyWei = keyBucketClaimWei / (stakedKeyAmount || 1n);

      totalKeyRewards += rewardPerStakedKeyWei;
    });

    const averageDailyRewardPerEsXai = totalEsXaiRewards / AVERAGE_WINDOW_DAYS;
    const averageDailyRewardPerKey = totalKeyRewards / AVERAGE_WINDOW_DAYS

    const averageDailyEsXaiReward = Number(averageDailyRewardPerEsXai);
    const averageDailyKeyReward = Number(averageDailyRewardPerKey);

    poolRewardRates.push({ poolAddress: poolInfo.address, averageDailyEsXaiReward, averageDailyKeyReward });

    // every BATCH_SIZE pools wait DELAY_MS to unblock thread
    if (index % BATCH_SIZE === 0) {
      await new Promise((resolve) => { setTimeout(resolve, DELAY_MS) });
    }
  }

  return poolRewardRates;
}
