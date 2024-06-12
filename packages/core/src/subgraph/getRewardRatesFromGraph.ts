import { GraphQLClient, gql } from "graphql-request";
import { config } from "../config.js";

// TODO: update type and corresponding code in function
type PoolInfoToPoolChallenge = {
  poolAddress: string;
  shares: {
    esXaiSplit: number;
    keySplit: number;
  };
  poolChallenges: {
    totalClaimedEsXaiAmount: number;
    totalStakedEsXaiAmount: number;
    totalStakedKeyAmount: number;
    submittedKeyCount: number;
    eligibleSubmissionsCount: number;
  }[];
}

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

  // TODO: remove
  throw new Error('not implemented');

  const client = new GraphQLClient(config.subgraphEndpoint);

  let queryWhere = "";
  if (poolAddresses.length !== 0) {
    queryWhere = `, where: {address_in: [${poolAddresses.map(o => `"${o.toLowerCase()}"`).join(",")}]}`;
  }

  // TODO: finish query!
  const query = gql`
    query PoolInfos {
      poolInfos(first: 1000${queryWhere}) {
        address
        owner
        delegateAddress
        totalStakedEsXaiAmount
        totalStakedKeyAmount
        metadata
      }
    }
  `

  const poolInfos = await client.request(query) as PoolInfoToPoolChallenge[];

  const poolRewardRates: PoolRewardRates[] = poolInfos.map(poolInfo => {

    // Take esXAI share of total claimed rewards and divide through total staked esXAI amount to get total claimed rewards per staked esXAI
    // Then divide through average window to get daily average
    const averageDailyRewardPerEsXai = poolInfo.poolChallenges
      .reduce((sum, { totalClaimedEsXaiAmount, totalStakedEsXaiAmount }) =>
        sum + (totalClaimedEsXaiAmount * poolInfo.shares.esXaiSplit / totalStakedEsXaiAmount), 0) / AVERAGE_WINDOW_DAYS;


    // Take key share of total claimed rewards and divide through total staked keys to get total claimed rewards per staked key
    // Then divide through average window to get daily average
    const averageDailyRewardPerKey = poolInfo.poolChallenges
      .reduce((sum, { totalClaimedEsXaiAmount, totalStakedKeyAmount }) =>
        sum + (totalClaimedEsXaiAmount * poolInfo.shares.keySplit / totalStakedKeyAmount), 0) / AVERAGE_WINDOW_DAYS;

    return { poolAddress: poolInfo.poolAddress, averageDailyRewardPerEsXai, averageDailyRewardPerKey };
  });

  return poolRewardRates;
}
