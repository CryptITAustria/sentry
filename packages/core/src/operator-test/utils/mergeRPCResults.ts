import { SentryWalletV2, SentryKeyV2 } from "../types/index.js";

/**
 * Merges RPC results into an array of SentryWalletV2 objects.
 *
 * @param {string[]} ownerAddresses - An array of owner addresses.
 * @param {bigint[]} keyIds - An array of key IDs.
 * @param {bigint[]} mintTimestamps - An array of mint timestamps.
 * @returns {SentryWalletV2[]} An array of SentryWalletV2 objects.
 */
export const mergeRPCResults = (ownerAddresses: string[], filteredOwnerAddresses: Set<string>, keyIds: bigint[], mintTimestamps: bigint[], ownerStakeResults: any): SentryWalletV2[] => {
    let wallets: SentryWalletV2[] = [];

    for (let i = 0; i < ownerAddresses.length; i++) {
        const ownerAddress = ownerAddresses[i];
        if (wallets.find(wallet => wallet.address === ownerAddress) === undefined) {
            const ownerWallet: SentryWalletV2 = createSentryWalletFromRPCData(ownerAddress, ownerAddresses, keyIds, mintTimestamps);
            wallets.push(ownerWallet);
        }
    }
    wallets = mergeOwnerStakingResults(filteredOwnerAddresses, wallets, ownerStakeResults);
    return wallets;
}

/**
 * Creates a SentryWalletV2 object from RPC data.
 *
 * @param {string} ownerAddress - The address of the wallet owner.
 * @param {string[]} ownerAddresses - An array of owner addresses.
 * @param {bigint[]} keyIds - An array of key IDs.
 * @param {bigint[]} mintTimestamps - An array of mint timestamps.
 * @returns {SentryWalletV2} A SentryWalletV2 object.
 */
const createSentryWalletFromRPCData = (ownerAddress: string, ownerAddresses: string[], keyIds: bigint[], mintTimestamps: bigint[]): SentryWalletV2 => {
    const ownerSentryWallet: SentryWalletV2 = {
        address: ownerAddress,
        keyCount: BigInt(0),
        stakedKeyCount: BigInt(0),
        v1EsXaiStakeAmount: BigInt(0),
        sentryKeys: [],
    };

    for (let i = 0; i < ownerAddresses.length; i++) {
        const currentAddress = ownerAddresses[i];
        const currentKeyId = keyIds[i];
        const currentMintTimestamp = mintTimestamps[i];

        if (ownerAddress === currentAddress) {
            const sentryKey: SentryKeyV2 = {
                keyId: currentKeyId,
                mintTimeStamp: currentMintTimestamp,
                submissions: [],
            };
            ownerSentryWallet.sentryKeys.push(sentryKey);
        }
    }
    return ownerSentryWallet;
};


const mergeOwnerStakingResults = (ownerAddresses: Set<string>, wallets: SentryWalletV2[], ownerStakeResults: any): SentryWalletV2[] => {
    const mergedWallets: SentryWalletV2[] = [];

    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const ownerAddress = wallet.address;
        const [ownerKeyCount, ownerStakedKeyCount, ownerV1EsXaiStakeAmount] = extractSpecificOwnerResults(ownerAddresses, ownerStakeResults, ownerAddress);
        wallet.keyCount = ownerKeyCount;
        wallet.stakedKeyCount = ownerStakedKeyCount;
        wallet.v1EsXaiStakeAmount = ownerV1EsXaiStakeAmount;
        mergedWallets.push(wallet);
    }
    

    return wallets;
}

const extractSpecificOwnerResults = (ownerAddresses: Set<string>, ownerStakeResults: any, ownerAddress: string): [bigint, bigint, bigint] => {
    const keyCounts = ownerStakeResults[0];
    const stakedKeyCounts = ownerStakeResults[1];
    const v1EsXaiStakeAmounts = ownerStakeResults[2];

    let ownerIndex = 0;
    
    for (let address of ownerAddresses) {
        if (address === ownerAddress) {
            const ownerKeyCount = BigInt(keyCounts[ownerIndex]);
            const ownerStakedKeyCount = BigInt(stakedKeyCounts[ownerIndex]);
            const ownerV1EsXaiStakeAmount = BigInt(v1EsXaiStakeAmounts[ownerIndex]);
            return [ownerKeyCount, ownerStakedKeyCount, ownerV1EsXaiStakeAmount];
        }
        ownerIndex++;
    }
    return [BigInt(0), BigInt(0), BigInt(0)];
}
