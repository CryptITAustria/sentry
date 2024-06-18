import { GraphQLClient, gql } from "graphql-request";
import { config } from "../config.js";
import { sleep } from "../utils/sleep.js";

type PoolRewardRates = {
  poolAddress: string;
  averageDailyEsXaiReward: number;
  averageDailyKeyReward: number;
}

const AVERAGE_WINDOW_DAYS = 7n;
const BATCH_SIZE = 10; // 10 pools per batch, may be adjusted as needed
const SLEEP_TIME = 100; // 100 ms sleep time between batches, may be adjusted as needed

async function fetchPoolAddresses(client: GraphQLClient): Promise<string[]> {
  const query = gql`
    query {
      poolInfos(first: 10000, orderBy: totalStakedEsXaiAmount, orderDirection: desc) {
        address
      }
    }
  `;
  const result = await client.request(query) as any;
  return result.poolInfos.map((pool: any) => pool.address);
}

async function fetchPoolChallenges(client: GraphQLClient, poolAddresses: string[], startTimestamp: number, skip: number = 0): Promise<any[]> {
  const query = gql`
    query PoolChallenges($startTimestamp: Int!, $poolAddresses: [String!], $skip: Int!) {
      poolChallenges(where: {assertionTimestamp_gt: $startTimestamp, pool_in: $poolAddresses}, first: 1000, skip: $skip) {
        id
        totalClaimedEsXaiAmount
        totalStakedEsXaiAmount
        totalStakedKeyAmount
        assertionTimestamp
        pool {
          id
          address
          keyBucketShare
          stakedBucketShare
        }
      }
    }
  `;
  const result = await client.request(query, { startTimestamp, poolAddresses, skip }) as any;
  return result.poolChallenges;
}

export async function getRewardRatesFromGraph(poolAddresses: string[]): Promise<PoolRewardRates[]> {
  const client = new GraphQLClient(config.subgraphEndpoint);

  const unixAverageWindowPlus5Mins = Number(AVERAGE_WINDOW_DAYS) * 24 * 60 * 60 * 1000 + 5 * 60 * 1000;
  const startTimestamp = Math.floor((Date.now() - unixAverageWindowPlus5Mins) / 1000);

  if (poolAddresses.length === 0) {
    poolAddresses = await fetchPoolAddresses(client);
  }

  const poolRewardRatesMap: { [key: string]: PoolRewardRates } = {};
  let skip = 0;
  let moreData = true;

  while (moreData) {
    const poolChallenges = await fetchPoolChallenges(client, poolAddresses, startTimestamp, skip);
    if (poolChallenges.length === 0) {
      moreData = false;
      continue;
    }

    for (const poolChallenge of poolChallenges) {
      const pool = poolChallenge.pool;
      const stakedBucketShare = BigInt(pool.stakedBucketShare);
      const keyBucketShare = BigInt(pool.keyBucketShare);

      let totalEsXaiRewards = 0n;
      let totalKeyRewards = 0n;

      const stakedEsXaiAmountWei = BigInt(poolChallenge.totalStakedEsXaiAmount);
      const stakedKeyAmount = BigInt(poolChallenge.totalStakedKeyAmount);

      // esXAI
      const esXaiBucketClaimWei = (BigInt(poolChallenge.totalClaimedEsXaiAmount) * stakedBucketShare) / 1_000_000n;
      const rewardPerStakedEsXaiWei = esXaiBucketClaimWei / (stakedEsXaiAmountWei || 1n);

      totalEsXaiRewards += rewardPerStakedEsXaiWei;

      // keys
      const keyBucketClaimWei = (BigInt(poolChallenge.totalClaimedEsXaiAmount) * keyBucketShare) / 1_000_000n;
      const rewardPerStakedKeyWei = keyBucketClaimWei / (stakedKeyAmount || 1n);

      totalKeyRewards += rewardPerStakedKeyWei;

      const averageDailyRewardPerEsXai = totalEsXaiRewards / AVERAGE_WINDOW_DAYS;
      const averageDailyRewardPerKey = totalKeyRewards / AVERAGE_WINDOW_DAYS;

      const averageDailyEsXaiReward = Number(averageDailyRewardPerEsXai);
      const averageDailyKeyReward = Number(averageDailyRewardPerKey);

      if (!poolRewardRatesMap[pool.address]) {
        poolRewardRatesMap[pool.address] = { poolAddress: pool.address, averageDailyEsXaiReward, averageDailyKeyReward };
      } else {
        poolRewardRatesMap[pool.address].averageDailyEsXaiReward += averageDailyEsXaiReward;
        poolRewardRatesMap[pool.address].averageDailyKeyReward += averageDailyKeyReward;
      }
    }

    skip += BATCH_SIZE;
    await sleep(SLEEP_TIME);
  }

  const poolRewardRates = Object.values(poolRewardRatesMap);
  return poolRewardRates;
}