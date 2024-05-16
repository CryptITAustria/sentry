import { Challenge } from "@sentry/sentry-subgraph-client";
import { GraphQLClient, gql } from 'graphql-request'

/**
 * @returns The challenge entity from the graph.
 */
export async function getLatestChallengeFromGraph(
  client: GraphQLClient,
  first: number = 1,
  skip: number = 0
): Promise<Challenge[]> {

  const query = gql`
    query Challenges {
      challenges(first: ${first}, skip: ${skip}, orderBy: challengeNumber, orderDirection: desc) {
        amountClaimedByClaimers
        challengeNumber
        numberOfEligibleClaimers
        createdTimestamp
        submissions(where: {eligibleForPayout: true} first: 5000, orderBy: nodeLicenseId, orderDirection: asc) {
          claimed
          eligibleForPayout
          createdTxHash
          claimTxHash
          nodeLicenseId
        }
      }
    }
  `

  const result = await client.request(query) as any;
  return result.challenges;
}