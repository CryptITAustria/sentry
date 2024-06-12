import { GraphQLClient, gql } from 'graphql-request'
import { config } from "../config.js";

/**
 * @returns The reward rate for a specific pool from the graph.
 */
export async function getPoolRewardRate(poolAddress:string): Promise<number> {

  const client = new GraphQLClient(config.subgraphEndpoint);

  //TODO Check if the current rewards rate is expired and if so, fetch the new rewards rate

  const now = Date.now(); // current time in milliseconds
  const sevenDaysPlus5Mins = 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000;
  const startTimestamp = Math.floor((now - sevenDaysPlus5Mins)/1000);

  const query = gql`
      query GetPoolRewardRateQuery {
        poolChallenges(
          where: {pool: {address: ${poolAddress}}, assertionTimestamp_gt: ${startTimestamp}}
          orderBy: id
          orderDirection: asc
        ) {
          id
          challenge{
          assertionTimestamp
          }
          pool {
                address
                }
          }
      }
    `
  const result = await client.request(query) as any;

  // Loop through the challenges and sum the total of all claimed rewards
  // Determine the daily average reward rate by dividing the total rewards by the number of days(7)
  // return the daily average reward rate

 // return result.challenges[0];
}