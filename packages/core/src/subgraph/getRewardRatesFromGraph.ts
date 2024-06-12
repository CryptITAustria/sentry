import { GraphQLClient, gql } from "graphql-request";
import { config } from "../config.js";
import { PoolInfo } from "@sentry/sentry-subgraph-client";

type PoolRewardRates = {
  poolAddress: string;
  averageDailyRewardPerEsXai: number;
  averageDailyRewardPerKey: number;
}

const AVERAGE_WINDOW_DAYS = 7;

/**
 * 
 * @param poolAddresses - The filter for the pool address (leave empty to get for all pools)
 * @returns List of pool reward rate objects with the pool address and average daily reward rates for esXAI and keys.
 */
export async function getRewardRatesFromGraph(
  poolAddresses: string[]
): Promise<PoolRewardRates[]> {

  const client = new GraphQLClient(config.subgraphEndpoint);

  let queryWhere = "";
  if (poolAddresses.length !== 0) {
    queryWhere = `, where: {address_in: [${poolAddresses.map(o => `"${o.toLowerCase()}"`).join(",")}]}`;
  }

  const unixAverageWindowPlus5Mins = AVERAGE_WINDOW_DAYS * 24 * 60 * 60 * 1000 + 5 * 60 * 1000;
  const startTimestamp = Math.floor((Date.now() - unixAverageWindowPlus5Mins)/1000);

  const query = gql`
    query PoolInfos {
      poolInfos(first: 10000, orderBy: totalStakedEsXaiAmount, orderDirection: desc${queryWhere}) {
        poolChallenges(where: {challenge_: {assertionTimestamp_gt: ${startTimestamp}}}) {
          totalClaimedEsXaiAmount
          totalStakedEsXaiAmount
          totalStakedKeyAmount
        }
        address
        keyBucketShare
        stakedBucketShare
      }
    }
  `

  const result = await client.request(query) as any;

  const poolInfos: PoolInfo[] = result.poolInfos;

  const poolRewardRates: PoolRewardRates[] = poolInfos.map((poolInfo: PoolInfo) => {

    // shares are saved as BigInt with percent values with 4 trailing "0": 50 % would equal "500000"
    const stakedBucketShare = poolInfo.stakedBucketShare;

    // Take esXAI share of total claimed rewards and divide through total staked esXAI amount to get total claimed rewards per staked esXAI
    // Then divide through average window to get daily average
    const averageDailyRewardPerEsXai = poolInfo.poolChallenges
      .reduce((sum, { totalClaimedEsXaiAmount, totalStakedEsXaiAmount }) =>
        sum + (totalClaimedEsXaiAmount * stakedBucketShare / totalStakedEsXaiAmount), 0) / AVERAGE_WINDOW_DAYS;

    // shares are saved as BigInt with percent values with 4 trailing "0": 50 % would equal "500000"
    const keyBucketShare = poolInfo.keyBucketShare;

    // Take key share of total claimed rewards and divide through total staked keys to get total claimed rewards per staked key
    // Then divide through average window to get daily average
    const averageDailyRewardPerKey = poolInfo.poolChallenges
      .reduce((sum, { totalClaimedEsXaiAmount, totalStakedKeyAmount }) =>
        sum + (totalClaimedEsXaiAmount * keyBucketShare / totalStakedKeyAmount), 0) / AVERAGE_WINDOW_DAYS;

    return { poolAddress: poolInfo.address, averageDailyRewardPerEsXai, averageDailyRewardPerKey };
  });

  return poolRewardRates;
}
