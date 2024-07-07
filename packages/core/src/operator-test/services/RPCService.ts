import { ethers } from 'ethers';
import { Challenge, RefereeConfig, SentryKey } from '@sentry/sentry-subgraph-client';
import { SentryWalletV2 } from '../types/index.js';

/**
 * Service for interacting with the blockchain via RPC.
 */
export class RPCService {
  private provider: ethers.Provider;
  private logFunction?: (log: string) => void;

  /**
   * Constructs an instance of the RPCService.
   * @param {ethers.Provider} provider - The ethers provider instance for interacting with the blockchain.
   * @param {Function} [logFunction] - Optional logging function.
   */
  constructor(provider: ethers.Provider, logFunction?: (log: string) => void) {
    this.provider = provider;
    this.logFunction = logFunction;
  }

  /**
   * Logs a message with a specified log level.
   * @param {'info' | 'warn' | 'error'} level - The log level.
   * @param {string} message - The log message.
   */
  private log(level: 'info' | 'warn' | 'error', message: string): void {
    if (this.logFunction) {
      switch (level) {
        case 'info':
          this.logFunction(`[RPC Service] Info: ${message}`);
          break;
        case 'warn':
          this.logFunction(`[RPC Service] WARN: ${message}`);
          break;
        case 'error':
          this.logFunction(`[RPC Service] ERROR: ${message}`);
          break;
      }
    }
  }

  /**
   * Fetches the latest block number from the blockchain.
   * @returns {Promise<number>} - The latest block number.
   * @throws Will throw an error if the block number retrieval fails.
   */
  async getLatestBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      this.log('error', `Failed to get latest block number: ${error}`);
      throw error;
    }
  }

  /**
   * Loads operator keys via RPC.
   * @param {string} operatorAddress - The operator address.
   * @returns {Promise<{wallets: SentryWalletV2[], poolsOperated: string[]}>} - The operator's wallets and operated pools.
   * @throws Will throw an error if the keys retrieval fails.
   */
  async getOperatorKeysFromRPC(operatorAddress: string): Promise<{
    wallets: SentryWalletV2[],
    poolsOperated: string[],
    refereeConfig:RefereeConfig
  }> {
    try {  
      // TODO Implement RPC call to fetch operator keys  
      const tempConfig = {        
      id: "refereeConfig",
      version: BigInt(0),
      maxStakeAmountPerLicense: BigInt(0),
      maxKeysPerPool: BigInt(0),
      stakeAmountTierThresholds: [],
      stakeAmountBoostFactors: []
      }
      return { wallets: [], poolsOperated: [], refereeConfig: tempConfig};
    } catch (error) {
      this.log('error', `Error in loadOperatorKeys: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches the latest challenge via RPC.
   * @returns {Promise<Challenge>} - The latest challenge data.
   * @throws Will throw an error if the challenge retrieval fails.
   */
  async getLatestChallengeFromRPC(): Promise<Challenge> {
    try {
      // TODO Implement RPC call to fetch latest challenge
      return { 
        challengeNumber: 0, 
        id: "", 
        status: "OpenForSubmissions", 
        assertionId: "", 
        assertionStateRootOrConfirmData: "", 
        rollupUsed: "",
        createdTimestamp: 0, 
        assertionTimestamp: 0, 
        challengerSignedHash: "",
        activeChallengerPublicKey: "",
        totalSupplyOfNodesAtChallengeStart: 0,
        rewardAmountForClaimers: 0,
        amountForGasSubsidy: 0,
        numberOfEligibleClaimers: 0,
        amountClaimedByClaimers: 0,
        submissions: []
      };
    } catch (error) {
      this.log('error', `Error in getLatestChallenge: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches a specific challenge via RPC.
   * @param {bigint} challengeNumber - The challenge number to fetch.
   * @returns {Promise<Challenge>} - The specific challenge data.
   * @throws Will throw an error if the challenge retrieval fails.
   */
  async getSpecificChallengeFromRPC(challengeNumber: bigint): Promise<Challenge> {
    try {
      // TODO Implement RPC call to fetch specific challenge
      return { 
        challengeNumber: 0, 
        id: "", 
        status: "OpenForSubmissions", 
        assertionId: "", 
        assertionStateRootOrConfirmData: "", 
        rollupUsed: "",
        createdTimestamp: 0, 
        assertionTimestamp: 0, 
        challengerSignedHash: "",
        activeChallengerPublicKey: "",
        totalSupplyOfNodesAtChallengeStart: 0,
        rewardAmountForClaimers: 0,
        amountForGasSubsidy: 0,
        numberOfEligibleClaimers: 0,
        amountClaimedByClaimers: 0,
        submissions: []
      };
    } catch (error) {
      this.log('error', `Error in getSpecificChallenge: ${error}`);
      throw error;
    }
  }
}
