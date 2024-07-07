import { SubgraphService } from './SubgraphService.js';
import { RPCService } from './RPCService.js';
import { ethers } from 'ethers';
import { Challenge, PoolInfo, RefereeConfig, SentryKey, SentryWallet } from '@sentry/sentry-subgraph-client';
import { SentryWalletV2 } from '../types/index.js';

/**
 * Facade class to abstract the interaction with Subgraph and RPC services.
 * Operator classes do not need to care about the underlying service implementation.
 */
export class SubgraphFacade extends SubgraphService {
  private rpcService: RPCService;

  /**
   * Constructor for SubgraphFacade.
   * @param {string} subgraphEndpoint - The endpoint URL for the subgraph.
   * @param {ethers.Provider} provider - The ethers.js provider instance for interacting with the blockchain via RPC.
   * @param {(log: string) => void} [logFunction] - Optional logging function to log messages.
   */
  constructor(subgraphEndpoint: string, provider: ethers.Provider, logFunction?: (log: string) => void) {
    super(subgraphEndpoint, logFunction);
    this.rpcService = new RPCService(provider, logFunction);
  }

  /**
   * Fetches the latest challenge.
   * If the subgraph is healthy, it fetches from the subgraph. Otherwise, it falls back to RPC.
   * @returns {Promise<Challenge>} - The latest challenge data.
   */
  async getLatestChallenge(): Promise<Challenge> {
    try {
      const health = await this.getHealthStatus();
      if (health.healthy) {
        return await this.getLatestChallengeFromGraph();
      } else {
        this.log('error', "Subgraph is unhealthy, falling back to RPC");
        return await this.rpcService.getLatestChallengeFromRPC();
      }
    } catch (error) {
      this.log('error', `Error in getLatestChallenge: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches a specific challenge by its number.
   * If the subgraph is healthy, it fetches from the subgraph. Otherwise, it falls back to RPC.
   * @param {bigint} challengeNumber - The number of the specific challenge to fetch.
   * @returns {Promise<Challenge>} - The specific challenge data.
   */
  async getSpecificChallenge(challengeNumber: bigint): Promise<Challenge> {
    try {
      const health = await this.getHealthStatus();
      if (health.healthy) {
        return await this.getSpecificChallengeFromGraph(challengeNumber);
      } else {
        this.log('error', "Subgraph is unhealthy, falling back to RPC");
        return await this.rpcService.getSpecificChallengeFromRPC(challengeNumber);
      }
    } catch (error) {
      this.log('error', `Error in getSpecificChallenge: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches operator keys and pools operated by the operator.
   * If the subgraph is healthy, it fetches from the subgraph. Otherwise, it falls back to RPC.
   * @param {string} operatorAddress - The address of the operator.
   * @returns {Promise<{wallets: SentryWalletV2[], poolsOperated: string[]}>} - The operator's keys and pools operated.
   */
  async getOperatorKeys(
    operatorAddress: string
  ): Promise<{
    wallets: SentryWalletV2[],
    poolsOperated: string[],
    refereeConfig:RefereeConfig
  }>{
    try {
      const health = await this.getHealthStatus();
      if (health.healthy) {
        return await this.getOperatorKeysFromGraph(operatorAddress);
      } else {
        this.log('error', "Subgraph is unhealthy, falling back to RPC");
        return await this.rpcService.getOperatorKeysFromRPC(operatorAddress);
      }
    } catch (error) {
      this.log('error', `Error in loadOperatorKeys: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches the latest block number from the blockchain.
   * This method uses the RPC service directly.
   * @returns {Promise<number>} - The latest block number.
   */
  async getLatestBlockNumber(): Promise<number> {
    return this.rpcService.getLatestBlockNumber();
  }
}
