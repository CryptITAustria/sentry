import Vorpal from "vorpal";

/**
 * Function to export the following info about all challenges as csv:
 * - challengeNumber
 * - timestamp
 * - amountClaimedByClaimers
 * - numberOfEligibleClaimers
 * - submissions claimed
 * - submissions total
 * @param {Vorpal} cli - The Vorpal instance to attach the command to.
 */
export function exportChallengeInfo(cli: Vorpal) {
    cli
        .command('export-challenge-info', 'Exports information about all past challenges as csv.')
        .action(async function (this: Vorpal.CommandInstance) {
            this.log('export-challenge-info works!');
        });
}
