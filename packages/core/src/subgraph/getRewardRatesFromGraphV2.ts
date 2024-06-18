import { GraphQLClient, gql } from "graphql-request";
import { config } from "../config.js";
import { PoolInfo } from "@sentry/sentry-subgraph-client";
import { sendSlackNotification } from "../utils/sendSlackNotification.js";
import { sleep } from "../utils/sleep.js";

type PoolRewardRates = {
  poolAddress: string;
  averageDailyEsXaiReward: number;
  averageDailyKeyReward: number;
}

const AVERAGE_WINDOW_DAYS = 7n;

//* Efficiency Settings below can be used to adjust the batch sizes and sleep time between
// requests this allows us to "tune" for efficiency and avoid hitting the subgraph rate limits.
// This will also help us measure what the graph is capable of handling.

const POOL_BATCH_SIZE = 50;
const CHALLENGE_BATCH_SIZE = 50;
const SLEEP_TIME = 100;

let totalPoolFetches = 0;
let totalPoolTime = 0;
let totalChallengeFetches = 0;
let totalChallengeTime = 0;

//* End of efficiency settings

async function fetchPoolInfos(client: GraphQLClient, skip: number): Promise<PoolInfo[]> {
  const query = gql`
    query PoolInfos($skip: Int!) {
      poolInfos(first: ${POOL_BATCH_SIZE}, skip: $skip, orderBy: totalStakedEsXaiAmount, orderDirection: desc) {
        id
        address
        keyBucketShare
        stakedBucketShare
      }
    }
  `;
  const start = Date.now();
  const result = await client.request(query, { skip });
  const end = Date.now();
  totalPoolFetches++;
  totalPoolTime += (end - start);
  return (result as any).poolInfos;
}

async function fetchPoolChallenges(client: GraphQLClient, poolId: string, startTimestamp: number, skip: number): Promise<any[]> {
  const query = gql`
    query PoolChallenges($poolId: String!, $startTimestamp: Int!, $skip: Int!) {
      poolChallenges(first: ${CHALLENGE_BATCH_SIZE}, skip: $skip, where: { pool: $poolId, challenge_: { assertionTimestamp_gt: $startTimestamp } }) {
        id
        totalClaimedEsXaiAmount
        totalStakedEsXaiAmount
        totalStakedKeyAmount
        challenge {
          assertionTimestamp
        }
      }
    }
  `;
  const start = Date.now();
  const result = await client.request(query, { poolId, startTimestamp, skip });
  const end = Date.now();
  totalChallengeFetches++;
  totalChallengeTime += (end - start);
  return (result as any).poolChallenges;
}

export async function getRewardRatesFromGraphV2(slackWebhookUrl?: string): Promise<PoolRewardRates[]> {
  const client = new GraphQLClient(config.subgraphEndpoint);

  const unixAverageWindowPlus5Mins = Number(AVERAGE_WINDOW_DAYS) * 24 * 60 * 60 * 1000 + 5 * 60 * 1000;
  const startTimestamp = Math.floor((Date.now() - unixAverageWindowPlus5Mins) / 1000);

  let poolInfos: PoolInfo[] = [];
  let skip = 0;

  // Fetch all pool infos in batched requests
  while (true) {
    const batch = await fetchPoolInfos(client, skip);
    if (batch.length === 0) break;
    poolInfos = poolInfos.concat(batch);
    skip += POOL_BATCH_SIZE;
    await sleep(SLEEP_TIME);
  }

  const poolRewardRates: PoolRewardRates[] = [];

  // Iterate the pool infos and fetch challenges for each pool
  // Challenges are fetched in batched requests
  for (const poolInfo of poolInfos) {
    const stakedBucketShare = BigInt(poolInfo.stakedBucketShare);
    const keyBucketShare = BigInt(poolInfo.keyBucketShare);

    let totalEsXaiRewards = 0n;
    let totalKeyRewards = 0n;

    let challengeSkip = 0;
    while (true) {
      const poolChallenges = await fetchPoolChallenges(client, poolInfo.id, startTimestamp, challengeSkip);
      if (poolChallenges.length === 0) break;

      poolChallenges.forEach(poolChallenge => {
        const challenge = poolChallenge.challenge;
        if (challenge.assertionTimestamp > startTimestamp) {
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
        }
      });

      challengeSkip += CHALLENGE_BATCH_SIZE;
      await sleep(SLEEP_TIME);
    }

    const averageDailyRewardPerEsXai = totalEsXaiRewards / AVERAGE_WINDOW_DAYS;
    const averageDailyRewardPerKey = totalKeyRewards / AVERAGE_WINDOW_DAYS

    const averageDailyEsXaiReward = Number(averageDailyRewardPerEsXai);
    const averageDailyKeyReward = Number(averageDailyRewardPerKey);

    poolRewardRates.push({ poolAddress: poolInfo.address, averageDailyEsXaiReward, averageDailyKeyReward });

    await sleep(SLEEP_TIME);
  }

  // Send slack notification with average fetch times if webhook url is provided
  if(slackWebhookUrl !== undefined) {
  const averagePoolFetchTime = Math.floor(totalPoolTime / totalPoolFetches);
  const averageChallengeFetchTime = Math.floor(totalChallengeTime / totalChallengeFetches);
  const slackMessage = `Fetched ${totalPoolFetches} pools in ${totalPoolTime} ms, avg. fetch time: ${averagePoolFetchTime} ms, Fetched ${totalChallengeFetches} challenges in ${totalChallengeTime} ms, avg. fetch time: ${averageChallengeFetchTime} ms`
  await sendSlackNotification(slackWebhookUrl, slackMessage);
  }
  return poolRewardRates;
}
