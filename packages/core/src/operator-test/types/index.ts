/**
 * This module defines various TypeScript types used across the application.
 * These types represent the structure of data related to Sentry Wallets, Sentry Keys, and Submissions.
 * 
 * @module types/index
 */

/**
 * Represents a Sentry Wallet (Version 2) is based on the refactored operator code.
 * @typedef {Object} SentryWalletV2
 * @property {string} address - The address of the wallet.
 * @property {bigint} keyCount - The number of keys associated with this wallet.
 * @property {bigint} stakedKeyCount - The number of staked keys associated with this wallet.
 * @property {bigint} v1EsXaiStakeAmount - The amount of v1 EsXai staked in this wallet.
 * @property {SentryKeyV2[]} sentryKeys - An array of SentryKeyV2 objects associated with this wallet.
 */
export type SentryWalletV2 = {
    address: string
    keyCount: bigint
    stakedKeyCount: bigint
    v1EsXaiStakeAmount: bigint
    sentryKeys: SentryKeyV2[]
}

/**
 * Represents a Sentry Key (Version 2) is based on the refactored operator code.
 * @typedef {Object} SentryKeyV2
 * @property {bigint} keyId - The unique identifier of the key.
 * @property {bigint} mintTimeStamp - The timestamp when the key was minted.
 * @property {SubmissionV2[]} submissions - An array of SubmissionV2 objects associated with this key.
 */
export type SentryKeyV2 = {
    keyId: bigint
    mintTimeStamp: bigint
    submissions: SubmissionV2[]
}

/**
 * Represents a submission (Version 2) is based on the refactored operator code.
 * @typedef {Object} SubmissionV2
 * @property {bigint} challengeNumber - The number of the challenge associated with this submission.
 * @property {boolean} claimed - Indicates whether the submission has been claimed.
 * @property {bigint} createdTimestamp - The timestamp when the submission was created.
 */
export type SubmissionV2 = {
    challengeNumber: bigint
    claimed: boolean
    createdTimestamp: bigint
}

/**
 * Represents an eligible unclaimed submission.
 * @typedef {Object} PendingOldClaim
 * @property {SubmissionV2} submission - The submission associated with the pending old claim.
 * @property {SentryKeyV2} key - The key associated with the pending old claim.
 * @property {SentryWalletV2} wallet - The wallet associated with the pending old claim.
 */
export type PendingOldClaim = {
    submission: SubmissionV2
    key: SentryKeyV2
    wallet: SentryWalletV2
}
