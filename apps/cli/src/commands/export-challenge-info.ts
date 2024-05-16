import { Challenge, NodeLicenseStatusMap, PublicNodeBucketInformation, config, getLatestChallengeFromGraph } from "@sentry/core";
import { ethers } from "ethers";
import fs from 'fs';
import os from 'os';
import path from 'path';
import Vorpal from "vorpal";
import { GraphQLClient } from 'graphql-request';

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
            await operatorRuntime(
                (log: string) => {
                    if (log.startsWith("Error")) {
                        this.log(log);
                        return;
                    }
                    this.log(log)
                }
            );
        });
}

async function operatorRuntime(
    logFunction: (log: string) => void = (_) => { },
): Promise<void> {
    const graphClient = new GraphQLClient(config.subgraphEndpoint);

    let offset = 0;
    const tableRows = [];
    while (true) {
        const challenges = await getLatestChallengeFromGraph(graphClient, 10, 10 * offset);

        if (challenges.length == 0) {
            logFunction("Finished");
            arrayToCSV(tableRows);
            break;
        }

        logFunction(`Processing ${offset === 0 ? 1 : (10 * (offset))} - ${10 * (offset + 1)} = ${challenges.length} challenges`);

        for (let i = 0; i < challenges.length; i++) {
            const challenge = challenges[i];

            const tableRow = {
                challengeNumber: challenge.challengeNumber,
                timeStamp: challenge.createdTimestamp,
                amountClaimedByClaimers: challenge.amountClaimedByClaimers,
                numberOfEligibleClaimers: challenge.numberOfEligibleClaimers,
                submissionsClaimed: challenge.submissions.filter(s => s.claimed).length,
                submissionsTotal: challenge.submissions.length
            }

            tableRows.push(tableRow);
        }
        offset++
    }

    function arrayToCSV(data: Object[]): void {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => {
            return Object.values(obj).join(',');
        });
        const csv = [headers, ...rows].join('\n');

        const destination = path.join(os.homedir(), `challengeInfo${Date.now()}.csv`);

        fs.writeFile(destination, csv, (err: any) => {
            if (err) {
                logFunction(`Error writing to file: ${err}`);
            } else {
                logFunction(`CSV file has been saved to "${destination}"`);
            }
        });
    }
}
