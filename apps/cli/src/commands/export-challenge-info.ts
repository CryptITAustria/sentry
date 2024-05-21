import { getLatestChallengeFromGraph, retry } from "@sentry/core";
import fs from 'fs';
import os from 'os';
import path from 'path';
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
            let offset = 0;
            const tableRows = [];
            while (true) {
                const challenges = await retry(() => getLatestChallengeFromGraph(10, 10 * offset), 3);

                if (challenges.length == 0) {
                    this.log("Finished query from graph");
                    break;
                }

                this.log(`Processing challenge ${challenges[0].challengeNumber} - ${(BigInt(challenges[0].challengeNumber) - BigInt(challenges.length)).toString()}...`);

                for (let i = 0; i < challenges.length; i++) {
                    const challenge = challenges[i];

                    const tableRow = {
                        challengeNumber: challenge.challengeNumber,
                        timeStamp: `"${new Date(challenge.createdTimestamp * 1000).toLocaleString()}"`,
                        amountClaimedByClaimers: BigInt(challenge.amountClaimedByClaimers) / BigInt(10 ** 18),
                        numberOfEligibleClaimers: challenge.numberOfEligibleClaimers,
                        submissionsClaimed: challenge.submissions.filter(s => s.claimed).length,
                        submissionsTotal: challenge.submissions.length
                    }

                    tableRows.push(tableRow);
                }
                offset++
            }

            const headers = Object.keys(tableRows[0]).join(',');
            const rows = tableRows.map(obj => {
                return Object.values(obj).join(',');
            });
            const csv = [headers, ...rows].join('\n');

            const destination = path.join(os.homedir(), `challengesInfo-${Date.now()}.csv`);

            fs.writeFileSync(destination, csv);

            this.log(`CSV export has been saved to "${destination}"`);
        });
}