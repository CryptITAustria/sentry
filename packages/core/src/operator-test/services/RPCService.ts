import { ethers } from 'ethers';
import { Challenge, ChallengeStatus, RefereeConfig, SentryKey } from '@sentry/sentry-subgraph-client';
import { SentryWalletV2 } from '../types/index.js';
import { config, RefereeAbi } from '../../index.js';
import { mergeRPCResults } from '../utils/mergeRPCResults.js';
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
      const maxKeysToRetrieve = 1000;
      const refereeConfig = await this.getRefereeConfigFromRPC();
      const reader = new ethers.Contract(config.operatorReaderAddress, RefereeAbi, this.provider);
      const operatorResults = await reader.getOperatorKeys(operatorAddress, maxKeysToRetrieve);
      const ownerAddresses = operatorResults[0];
      const filteredOwnerAddresses = new Set(ownerAddresses as string[]);
      const keyIds = operatorResults[1];
      const mintTimestamps = operatorResults[2];
      const pools = operatorResults[3];
      const ownerStakeResults = await reader.getOwnerStakeAmounts(filteredOwnerAddresses);
      const wallets: SentryWalletV2[] = mergeRPCResults(ownerAddresses, filteredOwnerAddresses, keyIds, mintTimestamps, ownerStakeResults);

      return { wallets: wallets, poolsOperated: pools, refereeConfig: refereeConfig};
    } catch (error) {
      this.log('error', `Error in loadOperatorKeys: ${error}`);
      throw error;
    }
  }


  async getRefereeConfigFromRPC(): Promise<RefereeConfig> {
    try {  
      const reader = new ethers.Contract(config.operatorReaderAddress, RefereeAbi, this.provider);
      const refereeConfig = await reader.getRefereeConfig();
      const maxStakeAmountPerLicense = refereeConfig[0];
      const maxKeysPerPool = refereeConfig[1];
      const stakeAmountTierThresholds = refereeConfig[2];
      const stakeAmountBoostFactors = refereeConfig[3];      
      const refConfig = {        
      id: "refereeConfig",
      version: BigInt(0),
      maxStakeAmountPerLicense: BigInt(maxStakeAmountPerLicense),
      maxKeysPerPool: BigInt(maxKeysPerPool),
      stakeAmountTierThresholds: stakeAmountTierThresholds,
      stakeAmountBoostFactors: stakeAmountBoostFactors
      }
      return refConfig;
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
  async getLatestChallengeFromRPC(): Promise<Challenge> {    try {
    // TODO Change to Reader ABI after Reader deployment
    // TODO add reader address to config after deployment
    const reader = new ethers.Contract(config.operatorReaderAddress, RefereeAbi, this.provider);      
    const challenge = await reader.getLatestChallenge();
    const openForSubmissions = challenge[0];
    let currentStatus:ChallengeStatus = openForSubmissions ? "OpenForSubmissions" : "OpenForClaims";
    if (challenge[1]) {
      currentStatus = "Expired";
    }
    
    const assertionId = challenge[2].toNumber();
    const assertionStateRootOrConfirmData = challenge[3];
    const assertionTimestamp = challenge[4].toNumber();
    const challengerSignedHash = challenge[5];
    const activeChallengerPublicKey = challenge[6];
    const rollupUsed = challenge[7];
    const createdTimestamp = challenge[8].toNumber();
    const totalSupplyOfNodesAtChallengeStart = challenge[9].toNumber();
    const rewardAmountForClaimers = ethers.formatUnits(challenge[10], 18); 
    const amountForGasSubsidy = ethers.formatUnits(challenge[11], 18); 
    const numberOfEligibleClaimers = challenge[12].toNumber();
    const amountClaimedByClaimers = ethers.formatUnits(challenge[13], 18);
    const challengeNumber = BigInt(challenge[14]);

      return { 
        challengeNumber: challengeNumber, 
        id: "", 
        status: currentStatus, 
        assertionId: assertionId, 
        assertionStateRootOrConfirmData: assertionStateRootOrConfirmData, 
        rollupUsed: rollupUsed,
        createdTimestamp: createdTimestamp, 
        assertionTimestamp: assertionTimestamp, 
        challengerSignedHash: challengerSignedHash,
        activeChallengerPublicKey: activeChallengerPublicKey,
        totalSupplyOfNodesAtChallengeStart: totalSupplyOfNodesAtChallengeStart,
        rewardAmountForClaimers: rewardAmountForClaimers,
        amountForGasSubsidy: amountForGasSubsidy,
        numberOfEligibleClaimers: numberOfEligibleClaimers,
        amountClaimedByClaimers: amountClaimedByClaimers,
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
      // TODO Change to Reader ABI after Reader deployment
      // TODO add reader address to config after deployment
      const reader = new ethers.Contract(config.operatorReaderAddress, RefereeAbi, this.provider);      
      const challenge = await reader.getSpecificChallenge(challengeNumber);
      const openForSubmissions = challenge[0];
      let currentStatus:ChallengeStatus = openForSubmissions ? "OpenForSubmissions" : "OpenForClaims";
      if (challenge[1]) {
        currentStatus = "Expired";
      }
      
      const assertionId = challenge[2].toNumber();
      const assertionStateRootOrConfirmData = challenge[3];
      const assertionTimestamp = challenge[4].toNumber();
      const challengerSignedHash = challenge[5];
      const activeChallengerPublicKey = challenge[6];
      const rollupUsed = challenge[7];
      const createdTimestamp = challenge[8].toNumber();
      const totalSupplyOfNodesAtChallengeStart = challenge[9].toNumber();
      const rewardAmountForClaimers = ethers.formatUnits(challenge[10], 18); 
      const amountForGasSubsidy = ethers.formatUnits(challenge[11], 18); 
      const numberOfEligibleClaimers = challenge[12].toNumber();
      const amountClaimedByClaimers = ethers.formatUnits(challenge[13], 18);

      return { 
        challengeNumber: challengeNumber, 
        id: "", 
        status: currentStatus, 
        assertionId: assertionId, 
        assertionStateRootOrConfirmData: assertionStateRootOrConfirmData, 
        rollupUsed: rollupUsed,
        createdTimestamp: createdTimestamp, 
        assertionTimestamp: assertionTimestamp, 
        challengerSignedHash: challengerSignedHash,
        activeChallengerPublicKey: activeChallengerPublicKey,
        totalSupplyOfNodesAtChallengeStart: totalSupplyOfNodesAtChallengeStart,
        rewardAmountForClaimers: rewardAmountForClaimers,
        amountForGasSubsidy: amountForGasSubsidy,
        numberOfEligibleClaimers: numberOfEligibleClaimers,
        amountClaimedByClaimers: amountClaimedByClaimers,
        submissions: []
      };
    } catch (error) {
      this.log('error', `Error in getSpecificChallenge: ${error}`);
      throw error;
    }
  }
}
