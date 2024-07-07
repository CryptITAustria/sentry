
/**
 * Compare a challenge with an assertion posted to the public CDN by the public Xai node.
 * @param {Challenge} challenge - The challenge from the Referee contract.
 * @returns {Promise<() => Promise<{ publicNodeBucket: PublicNodeBucketInformation, error?: string }>>} Returns the assertion data from the CDN or an error on miss match.
 */

import { Challenge } from "@sentry/sentry-subgraph-client";
import { getPublicNodeFromBucket } from "./getPublicNodeFromBucket.js";
import { PublicNodeBucketInformation } from "../../index.js";

export const compareWithCDN = async(challenge: Challenge, cachedLogger: (log: string) => void):Promise<{ publicNodeBucket: PublicNodeBucketInformation, error?: string }> =>{
        let attempt = 1;
        let publicNodeBucket: PublicNodeBucketInformation | undefined;
        let lastError;
    
        while (attempt <= 3) {
            try {
                publicNodeBucket = await getPublicNodeFromBucket(challenge.assertionStateRootOrConfirmData);
                break;
            } catch (error) {
                cachedLogger(`Error loading assertion data from CDN for ${challenge.assertionStateRootOrConfirmData} with attempt ${attempt}.\n${error}`);
                lastError = error;
            }
            attempt++;
            await new Promise(resolve => setTimeout(resolve, 20000));
        }
    
        if (!publicNodeBucket) {
            throw new Error(`Failed to retrieve assertion data from CDN for ${challenge.assertionStateRootOrConfirmData} after ${attempt} attempts.\n${lastError}`);
        }
    
        if (publicNodeBucket.assertion !== Number(challenge.assertionId)) {
            return { publicNodeBucket, error: `Miss match between PublicNode and Challenge assertion number '${challenge.assertionId}'!` };
        }
    
        return { publicNodeBucket }
    }