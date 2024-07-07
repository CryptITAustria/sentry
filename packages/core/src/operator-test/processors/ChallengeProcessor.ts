import { ethers } from 'ethers';
import {
  PublicNodeBucketInformation,
  submitPoolAssertion,
  getSubmissionsForChallenges,
  claimRewardsBulk,
} from '../../operator/index.js';
import { Challenge, RefereeConfig, SentryKey } from '@sentry/sentry-subgraph-client';
import { PendingOldClaim, SentryKeyV2, SentryWalletV2 } from '../types/index.js';
import { submitMultipleAssertions as submitMultipleAssertionsCall } from '../../index.js';
import { compareWithCDN } from '../utils/compareWithCDN.js'; // Import the utility function
import { SubgraphFacade } from '../services/SubgraphFacade.js';
import { claimPoolSubmissionRewards } from '../../operator/claimPoolSubmissionRewards.js';

/**
 * Class responsible for processing challenges.
 */
export class ChallengeProcessor {
  private refereeConfig: RefereeConfig = {
    id: "refereeConfig",
    version: BigInt(0),
    maxStakeAmountPerLicense: BigInt(0),
    maxKeysPerPool: BigInt(0),
    stakeAmountTierThresholds: [],
    stakeAmountBoostFactors: []
  };
  private signer: ethers.Signer;
  private logFunction?: (log: string) => void;
  private cachedBoostFactor: { [ownerAddress: string]: bigint } = {};
  private wallets: SentryWalletV2[] = [];
  private pools: string[] = [];
  private subgraphFacade: SubgraphFacade;
  private onAssertionMissMatch: (publicNodeData: PublicNodeBucketInformation | undefined, challenge: Challenge, message: string) => void;

  /**
   * Constructs an instance of the ChallengeProcessor.
   * @param {KeyManager} keyManager - The KeyManager instance for managing keys.
   * @param {ethers.Signer} signer - The ethers signer instance for signing transactions.
   * @param {SubgraphFacade} subgraphFacade - The SubgraphFacade instance for interacting with the subgraph.
   * @param {Function} onAssertionMissMatch - Callback for handling assertion mismatches.
   * @param {Function} [logFunction] - Optional logging function.
   */

  constructor(
    signer: ethers.Signer,
    subgraphFacade: SubgraphFacade,
    onAssertionMissMatch: (publicNodeData: PublicNodeBucketInformation | undefined, challenge: Challenge, message: string) => void,
    logFunction?: (log: string) => void
  ) {
    this.signer = signer;
    this.subgraphFacade = subgraphFacade;
    this.logFunction = logFunction;
    this.onAssertionMissMatch = onAssertionMissMatch;
  }

  /**
   * Logs a message.
   * @param {string} message - The message to log.
   */
  private log(message: string): void {
    if (this.logFunction) {
      this.logFunction(`[ChallengeProcessor] ${message}`);
    }
  }

  /**
   * Refreshes keys by fetching the latest data from the key manager.
   * @private
   */
  private async _refreshKeys(): Promise<void> {
    const operatorAddress = await this.signer.getAddress();
    const { wallets, poolsOperated, refereeConfig } = await this.subgraphFacade.getOperatorKeys(operatorAddress);
    this.wallets = wallets;
    this.pools = poolsOperated;
    this.refereeConfig = refereeConfig;
  }

  /**
  * Processes a new challenge.
  * @param {Challenge} challenge - The challenge data.
  */
  async processNewChallenge(
    challenge: Challenge,
  ): Promise<void> {
    this.log(`Processing new challenge with number: ${challenge.challengeNumber}.`);
    this.cachedBoostFactor = {};

    // Step 1: Refresh keys
    await this._refreshKeys();

    // Step 2: Compare with CDN
    const { publicNodeBucket, error } = await compareWithCDN(challenge, this.log.bind(this));
    if (error) {
      this.handleAssertionMissMatch(publicNodeBucket, challenge, error);
      return;
    }

    // Step 3: Process pool submissions
    await this._processPoolSubmissions(challenge);

    // Step 4: Process key submissions
    await this._processKeySubmissions(challenge);

    // Step 5: Process closed challenge
    await this._processClosedChallenge(challenge.challengeNumber - 1n);
  }


  /**
   * Processes a closed challenge.
   * @param {bigint} challengeId - The challenge ID.
   */
  private async _processClosedChallenge(challengeId: bigint): Promise<void> {
    // Get the previous challenge from the subgraph
    const challenge = await this.subgraphFacade.getSpecificChallenge(challengeId);
    if (!challenge) {
      this.log(`Challenge ${challengeId} not found in the subgraph.`);
      return;
    }
    // Process the claims for the challenge
    await this._handleKeyClaims(challenge);
    await this._handlePoolClaims(challenge);
    await this._processOldClaims(challengeId);
  }

  /**
   * Handles claims for keys in a challenge.
   * @param {Challenge} challenge - The challenge data.
   * @private
   */
  private async _handleKeyClaims(challenge: Challenge): Promise<void> {
    const batchedClaimIds: bigint[] = [];
    const keysPerBatch = 100;
    // Loop through all wallets
    for (const wallet of this.wallets) {
      // Extract the sentry keys from the wallet (should only return un-staked keys)
      const sentryKeys = wallet.sentryKeys;
      // Loop through all sentry keys
      for (const sentryKey of sentryKeys) {
        // Check if the key is eligible for rewards
        if (this._keyIsWinner(sentryKey, wallet, challenge)) {
          // Add the key to the batched claim ids
          batchedClaimIds.push(sentryKey.keyId);
        }
      }
    }

    // Submit claims for the keys that are eligible for rewards
    if (batchedClaimIds.length) {
      //TODO Confirm this? What address should be used for claim batch?
      const claimForAddress = await this.signer.getAddress();
      await claimRewardsBulk(batchedClaimIds, challenge.challengeNumber, claimForAddress, keysPerBatch, this.signer, this.log);
    }
  }

  /**
   * Handles claims for pools in a challenge.
   * @param {Challenge} challenge - The challenge data.
   * @private
   */
  private async _handlePoolClaims(challenge: Challenge): Promise<void> {
    for (const poolAddress of this.pools) {
      // Check if the pool has submitted for the challenge
      // TODO
      // Check if the pool has claimed for the challenge
      // TODO
      // If the pool has submitted and not claimed, submit a pool claim
      await claimPoolSubmissionRewards(poolAddress, challenge.challengeNumber, this.signer, this.log);
    }
  }

  /**
   * Processes old claims for a challenge.
   * @param {bigint} challengeId - The challenge ID.
   * @private
   */
  private async _processOldClaims(challengeId: bigint): Promise<void> {
    const pendingChallengeClaims = this._extractOldClaimsToBeProcessedByChallenge(challengeId);
    for (const [challengeNumber, claims] of pendingChallengeClaims) {
      const challenge = await this.subgraphFacade.getSpecificChallenge(challengeNumber);
      const batchClaimIds: bigint[] = [];
      for (const claim of claims) {
        const { key, wallet } = claim;
        if (this._keyIsWinner(key, wallet, challenge)) {
          batchClaimIds.push(key.keyId);
        }
      }
      if (batchClaimIds.length) {
        await claimRewardsBulk(batchClaimIds, challenge.challengeNumber, await this.signer.getAddress(), 100, this.signer, this.log);
      }
    }
  }

  /**
   * Extracts old claims to be processed for a challenge.
   * @param {bigint} challengeId - The challenge ID.
   * @returns {Map<bigint, PendingOldClaim[]>} - A map of challenge numbers to pending old claims.
   * @private
   */
  private _extractOldClaimsToBeProcessedByChallenge(challengeId: bigint): Map<bigint, PendingOldClaim[]> {
    const pendingClaims = new Map<bigint, PendingOldClaim[]>();
    const endingChallengeId = challengeId - 1n;
    // Loop through all wallets
    for (let wallet of this.wallets) {
      // Extract the sentry keys from the wallet (should only return un-staked keys)
      const sentryKeys = wallet.sentryKeys;
      // Loop through all sentry keys
      for (let sentryKey of sentryKeys) {
        // Loop through all submissions for the sentry key
        for (let submission of sentryKey.submissions) {
          // Check if the submission is for an expired challenge and has not been claimed
          if (submission.challengeNumber <= endingChallengeId && !submission.claimed) {
            // Add the pending claim to the map by challenge number
            if (!pendingClaims.has(submission.challengeNumber)) {
              pendingClaims.set(submission.challengeNumber, []);
            }
            pendingClaims.get(submission.challengeNumber)?.push({
              submission: submission,
              key: sentryKey,
              wallet: wallet
            });
          }
        }
      }
    }
    return pendingClaims;
  }

  /**
   * Determines if a key is a winner for a challenge.
   * @param {SentryKeyV2} key - The key information.
   * @param {SentryWalletV2} wallet - The wallet information.
   * @param {Challenge} challenge - The challenge data.
   * @returns {boolean} - True if the key is a winner, false otherwise.
   * @private
   */
  private _keyIsWinner(key: SentryKeyV2, wallet: SentryWalletV2, challenge: Challenge): boolean {
    // Check if the key is eligible for the challenge
    // This confirms the mintTimeStamp of the key is less than the createdTimestamp of the challenge
    if (!this.isEligibleForChallenge(key, challenge)) {
      return false;
    }

    // Check if the key is eligible for payout
    // This confirms the key is eligible for payout based on the reward algorithm
    if (this.isEligibleForPayout(key, wallet, challenge.challengeNumber, challenge)) {
      return true;
    }

    return false;
  }

  /**
   * Checks if a key is eligible for a challenge.
   * @param {SentryKeyV2} keyInfo - The key information.
   * @param {Challenge} challenge - The challenge data.
   * @returns {boolean} - True if the key is eligible, false otherwise.
   */
  private isEligibleForChallenge(keyInfo: SentryKeyV2, challenge: Challenge): boolean {
    if (BigInt(challenge.createdTimestamp) <= keyInfo.mintTimeStamp) {
      this.log(`Sentry Key ${keyInfo.keyId} is not eligible for challenge ${challenge.challengeNumber}.`);
      return false;
    }
    return true;
  }

  /**
   * Checks if a key is eligible for payout.
   * @param {SentryKeyV2} keyInfo - The key information.
   * @param {SentryWalletV2} wallet - The wallet information.
   * @param {bigint} challengeNumber - The challenge number.
   * @param {Challenge} challenge - The challenge data.
   * @returns {boolean} - True if the key is eligible for payout, false otherwise.
   */
  private isEligibleForPayout(keyInfo: SentryKeyV2, wallet: SentryWalletV2, challengeNumber: bigint, challenge: Challenge): boolean {
    const keyOwner = wallet.address;
    try {
      if (!this.cachedBoostFactor[keyOwner]) {
        this.cachedBoostFactor[keyOwner] = this.calculateBoostFactor(wallet);
      }

      const [payoutEligible] = this.createAssertionHashAndCheckPayout(
        keyInfo.keyId,
        challengeNumber,
        this.cachedBoostFactor[keyOwner],
        challenge.assertionStateRootOrConfirmData,
        challenge.challengerSignedHash
      );

      if (!payoutEligible) {
        return false;
      }

      return true;
    } catch (error) {
      this.log(`Error checking payout eligibility for Sentry Key ${keyInfo.keyId} to challenge ${challengeNumber} - ${error}`);
      return false;
    }
  }

  /**
   * Retrieves the boost factor based on the staked amount.
   * @param {bigint} stakedAmount - The staked amount.
   * @returns {bigint} - The boost factor.
   */
  private getBoostFactor(stakedAmount: bigint): bigint {
    if (stakedAmount < this.refereeConfig.stakeAmountTierThresholds[0]) {
      return BigInt(100);
    }

    for (let tier = 1; tier < this.refereeConfig.stakeAmountTierThresholds.length; tier++) {
      if (stakedAmount < this.refereeConfig.stakeAmountTierThresholds[tier]) {
        return this.refereeConfig.stakeAmountBoostFactors[tier - 1];
      }
    }
    const lastIndex = this.refereeConfig.stakeAmountTierThresholds.length - 1;
    return this.refereeConfig.stakeAmountBoostFactors[lastIndex];
  }

  /**
   * Calculates the boost factor for a sentry wallet.
   * @param {SentryWalletV2} sentryWallet - The sentry wallet information.
   * @returns {bigint} - The calculated boost factor.
   */
  private calculateBoostFactor(sentryWallet: SentryWalletV2): bigint {
    let stakeAmount = BigInt(sentryWallet.v1EsXaiStakeAmount);
    let keyCount = BigInt(sentryWallet.keyCount) - BigInt(sentryWallet.stakedKeyCount);

    const maxStakeAmount = keyCount * BigInt(this.refereeConfig.maxStakeAmountPerLicense);
    if (stakeAmount > maxStakeAmount) {
      stakeAmount = maxStakeAmount;
    }

    return this.getBoostFactor(stakeAmount);
  }

  /**
   * Creates an assertion hash and checks payout eligibility.
   * @param {bigint} nodeLicenseId - The node license ID.
   * @param {bigint} challengeId - The challenge ID.
   * @param {bigint} boostFactor - The boost factor.
   * @param {string} confirmData - The confirm data.
   * @param {string} challengerSignedHash - The challenger signed hash.
   * @returns {[boolean, string]} - A tuple with payout eligibility and the assertion hash.
   */
  private createAssertionHashAndCheckPayout(
    nodeLicenseId: bigint,
    challengeId: bigint,
    boostFactor: bigint,
    confirmData: string,
    challengerSignedHash: string
  ): [boolean, string] {
    const assertionHash = ethers.keccak256(
      ethers.solidityPacked(
        ["uint256", "uint256", "bytes", "bytes"],
        [nodeLicenseId, challengeId, confirmData, challengerSignedHash]
      )
    );
    return [Number((BigInt(assertionHash) % BigInt(10_000))) < Number(boostFactor), assertionHash];
  }

  /**
   * Submits multiple assertions for a challenge.
   * @param {bigint[]} nodeLicenseIds - The node license IDs.
   * @param {bigint} challengeNumber - The challenge number.
   * @param {string} assertionStateRootOrConfirmData - The assertion state root or confirm data.
   * @private
   */
  private async submitMultipleAssertions(
    nodeLicenseIds: bigint[],
    challengeNumber: bigint,
    assertionStateRootOrConfirmData: string
  ): Promise<void> {
    this.log(`Submitting assertions for ${nodeLicenseIds.length} keys for challenge ${challengeNumber}`);

    // Define the maximum number of keys per batch
    const KEYS_PER_BATCH = 100;

    // Break down nodeLicenseIds into batches
    const batches = [];
    for (let i = 0; i < nodeLicenseIds.length; i += KEYS_PER_BATCH) {
      batches.push(nodeLicenseIds.slice(i, i + KEYS_PER_BATCH));
    }

    // Submit assertions for each batch
    for (const batch of batches) {
      try {
        // Call the submitMultipleAssertions function from the original implementation
        await submitMultipleAssertionsCall(batch, challengeNumber, assertionStateRootOrConfirmData, KEYS_PER_BATCH, this.signer, this.log);
        this.log(`Successfully submitted assertions for batch of ${batch.length} keys`);
      } catch (error) {
        this.log(`Error submitting assertions for batch: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Handles an assertion mismatch.
   * @param {PublicNodeBucketInformation | undefined} publicNodeData - The public node data.
   * @param {Challenge} challenge - The challenge data.
   * @param {string} message - The mismatch message.
   * @private
   */
  private handleAssertionMissMatch(
    publicNodeData: PublicNodeBucketInformation | undefined,
    challenge: Challenge,
    message: string
  ): void {
    this.onAssertionMissMatch(publicNodeData, challenge, message);
  }

  /**
   * Processes pool submissions for a challenge.
   * @param {Challenge} challenge - The challenge data.
   * @private
   */
  private async _processPoolSubmissions(challenge: Challenge): Promise<void> {
    for (const poolAddress of this.pools) {
      // Check if the pool has already submitted for the challenge      
      // TODO

      // If the pool has not submitted, submit a pool assertion
      await submitPoolAssertion(poolAddress, challenge.challengeNumber, challenge.assertionStateRootOrConfirmData, this.signer, this.log);
    }
  }

  /**
   * Processes key submissions for a challenge.
   * @param {Challenge} challenge - The challenge data.
   * @private
   */
  private async _processKeySubmissions(challenge: Challenge): Promise<void> {
    const batchedWinnerKeys: bigint[] = [];

    for (const wallet of this.wallets) {
      const sentryKeys = wallet.sentryKeys;

      // Loop Wallet's Sentry Keys And Process Individually
      for (const sentryKey of sentryKeys) {
        if (await this._keyIsWinner(sentryKey, wallet, challenge)) {
          batchedWinnerKeys.push(sentryKey.keyId);
        }
      }
    }

    // Submit assertions for the keys that are eligible for rewards
    if (batchedWinnerKeys.length) {
      await this.submitMultipleAssertions(batchedWinnerKeys, challenge.challengeNumber, challenge.assertionStateRootOrConfirmData);
    }
  }
}
