import { Challenge, PoolInfo, RefereeConfig, SentryKey, SentryWallet } from '@sentry/sentry-subgraph-client';
import { BaseSubgraphService } from './BaseSubgraphService.js';
import { gql } from 'graphql-request';
import { SentryWalletV2 } from '../types/index.js';

/**
 * Service for interacting with the subgraph.
 */
export class SubgraphService extends BaseSubgraphService {
  /**
   * Fetches the latest challenge from the subgraph.
   * @returns {Promise<Challenge>} - The latest challenge data.
   */
  async getLatestChallengeFromGraph(): Promise<Challenge> {
    const query = `
      query GetLatestChallenge {
        challenges(first: 1, orderBy: challengeNumber, orderDirection: desc) {
          challengeNumber
          assertionId
          assertionStateRootOrConfirmData
          rollupUsed
          createdTimestamp
          challengerSignedHash
        }
      }
    `;
    const result = await this.query<{ challenges: Challenge[] }>(query);
    return result.challenges[0];
  }

  /**
   * Fetches a specific challenge from the subgraph.
   * @param {bigint} challengeNumber - The challenge number to fetch.
   * @returns {Promise<Challenge>} - The specific challenge data.
   */
  async getSpecificChallengeFromGraph(challengeNumber: bigint): Promise<Challenge> {
    const query = `
      query GetSpecificChallenge($challengeNumber: BigInt!) {
        challenges(where: { challengeNumber: $challengeNumber }) {
          challengeNumber
          assertionId
          assertionStateRootOrConfirmData
          rollupUsed
          createdTimestamp
          challengerSignedHash
        }
      }
    `;
    const result = await this.query<{ challenges: Challenge[] }>(query, { challengeNumber });
    return result.challenges[0];
  }

  /**
   * Fetches the operator's keys and associated information from the subgraph.
   * @param {string} operatorAddress - The operator's address.
   * @returns {Promise<{ wallets: SentryWalletV2[], poolsOperated: string[], refereeConfig: RefereeConfig }>} - The operator's keys, pools operated, and referee configuration.
   */
  async getOperatorKeysFromGraph(operatorAddress: string): Promise<{
    wallets: SentryWalletV2[],
    poolsOperated: string[],
    refereeConfig: RefereeConfig
  }> {
    try {  
      const query = gql`
        query GetEligibleKeysAndPoolInfo($operatorAddress: Bytes!, $timestamp: BigInt!) {
          latestChallenge: challenges(orderBy: challengeNumber, orderDirection: desc, first: 1) {
            challengeNumber
            assertionStateRootOrConfirmData
            challengerSignedHash
          }
          
          wallets: sentryWallets(
            where: {
              or: [
                { address: $operatorAddress, sentryKeys_: {assignedPool: "0x"} },
                { approvedOperators_contains: [$operatorAddress], sentryKeys_: {assignedPool: "0x"} }
              ]
            }    
          ) {
            address
            keyCount
            stakedKeyCount
            v1EsXaiStakeAmount
            sentryKeys(where: {assignedPool: "0x"}) {
              keyId
              mintTimeStamp
              submissions(where: {createdTimestamp_gt: $timestamp, claimed: false}) {
                challengeNumber
                claimed
                createdTimestamp
              }
            }
          }
          
          poolsOperated: poolInfos(
            where: {
              or: [
                { owner: $operatorAddress },
                { delegateAddress: $operatorAddress }
              ]
            }
          ) {
            address
          }

          refereeConfig(id: "RefereeConfig") {
            maxKeysPerPool
            id
            maxStakeAmountPerLicense
            stakeAmountBoostFactors
            stakeAmountTierThresholds
            version
          }
        }
      `;
      
      // Get timestamp in seconds of now minus 270 days (270 days * 24 hours/day * 60 minutes/hour * 60 seconds/minute)
      const oldestClaimableChallenge = Math.floor(Date.now() / 1000) - 270 * 24 * 60 * 60;

      const variables = {
        operatorAddress: operatorAddress.toLowerCase(), // Ensure the address is in the correct format
        timestamp: oldestClaimableChallenge
      };
      
      const result = await this.client.request(query, variables) as any;
      const { wallets, poolsOperated, refereeConfig } = result;

      const walletsInfo = wallets.map((wallet: any) => {
        return {
          address: wallet.address,
          keyCount: wallet.keyCount,
          stakedKeyCount: wallet.stakedKeyCount,
          sentryKeys: wallet.sentryKeys,
          v1EsXaiStakeAmount: wallet.v1EsXaiStakeAmount
        };
      });
  
      const poolsOperatedInfo = poolsOperated.map((pool: any) => {
        return {
          poolPublicKey: pool.address
        };
      });
  
      return { wallets: walletsInfo, poolsOperated: poolsOperatedInfo, refereeConfig: refereeConfig };
    } catch (error) {
      this.log('error', `Error in loadOperatorKeys: ${error}`);
      throw error;
    }
  }
}
