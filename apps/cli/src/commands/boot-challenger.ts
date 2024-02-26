import Vorpal from "vorpal";
import axios from "axios";
import { ethers } from 'ethers';
import { config, createBlsKeyPair, getAssertion, getSignerFromPrivateKey, listenForAssertions, submitAssertionToReferee, EventListenerError, getProvider, RefereeAbi, retry, getSubmissionsForChallenges, submitAssertionToChallenge, NodeLicenseAbi, claimReward } from "@sentry/core";

import fs from "fs";
import crypto from 'crypto';

function generateRandomHexHash() {
    // 32 bytes is 256 bits, and each byte is represented by two hex characters
    const randomBytes = crypto.randomBytes(32);
    return "0x" + randomBytes.toString('hex');
}

type PromptBodyKey = "secretKeyPrompt" | "walletKeyPrompt" | "webhookUrlPrompt";

const INIT_PROMPTS: { [key in PromptBodyKey]: Vorpal.PromptObject } = {
    secretKeyPrompt: {
        type: 'password',
        name: 'secretKey',
        message: 'Enter the secret key of the challenger (You can run \'create-bls-key-pair\' to create this key):',
        mask: '*'
    },
    walletKeyPrompt: {
        type: 'password',
        name: 'walletKey',
        message: 'Enter the private key of the wallet that the challenger wants to use:',
        mask: '*'
    },
    webhookUrlPrompt: {
        type: 'input',
        name: 'webhookUrl',
        message: 'Enter the webhook URL if you want to post errors (optional):',
    }
}

const NUM_ASSERTION_LISTENER_RETRIES: number = 3; //The number of restart attempts if the listener errors
const NUM_CON_WS_ALLOWED_ERRORS: number = 10; //The number of consecutive WS error we allow before restarting the listener

// Prompt input cache
let cachedSigner: {
    address: string,
    signer: ethers.Signer
};
// let cachedOperator: ethers.Signer;
let cachedWebhookUrl: string | undefined;
let cachedSecretKey: string;
let lastAssertionTime: number;

let currentNumberOfRetries = 0;

const initCli = async (commandInstance: Vorpal.CommandInstance) => {

    const { secretKey } = await commandInstance.prompt(INIT_PROMPTS["secretKeyPrompt"]);
    if (!secretKey || secretKey.length < 1) {
        throw new Error("No secret key passed in. Please generate one with  'create-bls-key-pair'.")
    }

    cachedSecretKey = secretKey;
    const { publicKeyHex } = await createBlsKeyPair(cachedSecretKey);
    if (!publicKeyHex) {
        throw new Error("No publicKeyHex returned.");
    }

    commandInstance.log(`[${new Date().toISOString()}] Public Key of the Challenger: ${publicKeyHex}`);
    const { walletKey }: any = await commandInstance.prompt(INIT_PROMPTS["walletKeyPrompt"]);
    if (!walletKey || walletKey.length < 1) {
        throw new Error("No private key passed in. Please provide a valid private key.")
    }

    const { address, signer } = getSignerFromPrivateKey(walletKey);
    if (!address || !signer) {
        throw new Error(`Missing address: ${address} or signer ${signer}`);
    }
    cachedSigner = { address, signer };
    commandInstance.log(`[${new Date().toISOString()}] Address of the Wallet: ${cachedSigner!.address}`);

    const { webhookUrl }: any = await commandInstance.prompt(INIT_PROMPTS["webhookUrlPrompt"]);
    cachedWebhookUrl = webhookUrl;
    sendNotification('Challenger has started.', commandInstance);
    lastAssertionTime = Date.now();

}

const onAssertionConfirmedCb = async (nodeNum: any, commandInstance: Vorpal.CommandInstance) => {
    commandInstance.log(`[${new Date().toISOString()}] Assertion confirmed ${nodeNum}. Looking up the assertion information...`);
    const assertionNode = await getAssertion(nodeNum);
    commandInstance.log(`[${new Date().toISOString()}] Assertion data retrieved. Starting the submission process...`);
    try {
        await submitAssertionToReferee(
            cachedSecretKey,
            nodeNum,
            assertionNode,
            cachedSigner!.signer,
        );
        commandInstance.log(`[${new Date().toISOString()}] Submitted assertion: ${nodeNum}`);
        lastAssertionTime = Date.now();
    } catch (error) {
        commandInstance.log(`[${new Date().toISOString()}] Submit Assertion Error: ${(error as Error).message}`);
        sendNotification(`Submit Assertion Error: ${(error as Error).message}`, commandInstance);
        throw error;
    }
};

const checkTimeSinceLastAssertion = async (lastAssertionTime: number, commandInstance: Vorpal.CommandInstance) => {
    const currentTime = Date.now();
    commandInstance.log(`[${new Date().toISOString()}] The currentTime is ${currentTime}`);
    if (currentTime - lastAssertionTime > 70 * 60 * 1000) {
        const timeSinceLastAssertion = Math.round((currentTime - lastAssertionTime) / 60000);
        commandInstance.log(`[${new Date().toISOString()}] It has been ${timeSinceLastAssertion} minutes since the last assertion. Please check the Rollup Protocol (${config.rollupAddress}).`);
        sendNotification(`It has been ${timeSinceLastAssertion} minutes since the last assertion. Please check the Rollup Protocol (${config.rollupAddress}).`, commandInstance);
    }
};

const sendNotification = async (message: string, commandInstance: Vorpal.CommandInstance) => {
    if (cachedWebhookUrl) {
        try {
            await axios.post(cachedWebhookUrl, { text: message });
        } catch (error) {
            commandInstance.log(`[${new Date().toISOString()}] Failed to send notification request ${error && (error as Error).message ? (error as Error).message : error}`);
        }
    }
}


const startListener = async (commandInstance: Vorpal.CommandInstance) => {

    let errorCount = 0;
    let isStopping = false;

    const stopListener = (listener: any) => {
        if (!isStopping) {
            isStopping = true;
            listener.stop();
        }
    }

    return new Promise((resolve) => {
        const listener = listenForAssertions(
            async (nodeNum: any, blockHash: any, sendRoot: any, event: any, error?: EventListenerError) => {
                if (error) {
                    errorCount++;
                    // We should allow a defined number of consecutive WS errors before restarting the websocket at all
                    if (errorCount > NUM_CON_WS_ALLOWED_ERRORS) {
                        stopListener(listener);
                        resolve(error);
                    }
                    return;
                }


                try {
                    errorCount = 0;
                    await onAssertionConfirmedCb(nodeNum, commandInstance);
                    currentNumberOfRetries = 0;
                } catch {
                    stopListener(listener);
                    resolve(error);
                }
            },
            (v: string) => commandInstance.log(v),
        );
    })
}


/**
 * Starts a runtime of the challenger.
 * @param {Vorpal} cli - The Vorpal instance to attach the command to.
 */
export function bootChallenger(cli: Vorpal) {

    cli
        .command('boot-challenger', 'Starts a runtime of the challenger. You will need the secret key of the challenger to start. You can run \'create-bls-key-pair\' to create this key.')
        .action(async function (this: Vorpal.CommandInstance) {

            const commandInstance = this;

            const reportPath = `C:\\SEPOLIA_TEST_CHALLENGES\\sepolia-test-challenges-${Date.now()}.json`;

            // Listen for process termination and call the handler
            process.on('SIGINT', async () => {
                commandInstance.log(`[${new Date().toISOString()}] The challenger has been terminated manually.`);
                process.exit();
            });

            // Check if submit assertion has not been run for over 1 hour and 10 minutes
            // const assertionCheckInterval = setInterval(() => {
            //     checkTimeSinceLastAssertion(lastAssertionTime, commandInstance);
            // }, 5 * 60 * 1000);

            // Get the provider
            const provider = getProvider();

            // Create an instance of the Referee contract
            const refereeContract = new ethers.Contract(config.refereeAddress, RefereeAbi, provider);
            // Create an instance of the NodeLicense contract
            const nodeLicenseContract = new ethers.Contract(config.nodeLicenseAddress, NodeLicenseAbi, provider);

            const fakeChallenger = getSignerFromPrivateKey("0x83e391bdc88132de5b6bc84c72a7def379d4e02c79016106857cbe9040792649");
            const cachedChallenger = fakeChallenger.signer;

            const fakeOperator = getSignerFromPrivateKey("0xc8014ec914046082063e268da1d8f609a22b8425e1225442ff24fbee034cdfaa");
            const cachedOperator = fakeOperator.signer;

            // Get the count of challenges

            // Create an instance of the Referee contract
            const refereeWriteChallenger = new ethers.Contract(config.refereeAddress, RefereeAbi, cachedChallenger);

            const testKeyHolder = [
                "0xb5dE6BA52417d138f475E3acfE5789C3dF2ba534",
                "0x0ef797CAF6031520a119017FB8e3A64e07294eD7",
                "0xd59C357A34D753Ae77EF5eF914ED32BD7aB4AE2F",
                "0x1e7238C45C80e45b5D33b3b6D647427146bE1366",
                "0x54E9CFF378dAF818D082fE9764e15470f34058D2",
            ]
            // const testKeys = [231n, 232n, 233n, 234n, 239n];
            const testKeys: bigint[] = [];
            const testKeysBoostFactors: bigint[] = [];

            const testData: {
                totalChallengesRun: number,
                testChallengeIds: number[],
                keyData: {
                    [keyId: string]: {
                        owner: string,
                        winCount: number,
                        stakedAmount: string,
                        boostFactor: number,
                        wonChallenges: number[],
                    }
                }

            } = { keyData: {}, totalChallengesRun: 0, testChallengeIds:[] }

            console.log("Loading test key owner data");
            for (let i = 0; i < testKeyHolder.length; i++) {
                const firstKeyId = await nodeLicenseContract.tokenOfOwnerByIndex(testKeyHolder[i], 0);
                testKeys.push(firstKeyId);
                const stakedAmount = await refereeContract.stakedAmounts(testKeyHolder[i]);
                const boostFactor = await refereeContract.getBoostFactor(stakedAmount);
                testKeysBoostFactors.push(boostFactor);
                testData.keyData[firstKeyId.toString()] = {
                    owner: testKeyHolder[i],
                    winCount: 0,
                    stakedAmount: stakedAmount.toString(),
                    boostFactor: boostFactor.toString(),
                    wonChallenges: []
                }
                console.log(
                    "Loaded data for key owner",
                    testKeyHolder[i],
                    "firstKey: " + firstKeyId.toString(),
                    "stakedAmount: " + stakedAmount.toString(),
                    "boostFactor: " + boostFactor.toString()
                );
            }

            let counter = Number(await refereeContract.challengeCounter());
            console.log("Current ChallengeCount = " + counter);
            let lastChallenge = {
                assertionId: BigInt(counter + 15),
                predecessorAssertionId: BigInt(counter + 14),
                confirmData: generateRandomHexHash(),
                assertionTimestamp: Math.floor(Date.now() / 1000),
                challengerSignedHash: generateRandomHexHash()
            }

            console.log("Submit next test challenge");
            // Submit the challenge to the Referee contract
            const tx = await refereeWriteChallenger.submitChallenge(
                lastChallenge.assertionId,
                lastChallenge.predecessorAssertionId,
                lastChallenge.confirmData,
                lastChallenge.assertionTimestamp,
                lastChallenge.challengerSignedHash,
            );
            console.log("Submitted test challenge, waiting for confirm...");
            await tx.wait(1);
            console.log("Confirm awaited");

            counter++;

            const RUNS_FOR_TEST = 5000;

            while (testData.totalChallengesRun < RUNS_FOR_TEST) {

                testData.totalChallengesRun++;

                try {

                    const winnerKeys: bigint[] = [];
                    const currentChallengeId = (await refereeContract.challengeCounter()) - BigInt(1);
                    testData.testChallengeIds.push(Number(currentChallengeId))
                    console.log("Starting check reward for currentChallenge", currentChallengeId.toString());

                    for (let i = 0; i < testKeys.length; i++) {
                        console.log("Check if key can win for challenge ", currentChallengeId.toString(), testKeys[i].toString());
                        let payoutEligible = false;
                        try {
                            [payoutEligible] = await refereeContract.createAssertionHashAndCheckPayout(
                                testKeys[i],
                                currentChallengeId,
                                BigInt(testData.keyData[testKeys[i].toString()].boostFactor),
                                lastChallenge.confirmData,
                                lastChallenge.challengerSignedHash
                            );
                        } catch (error) {
                            console.error("Failed to createAssertionHashAndCheckPayout", error);
                            // continue;
                        }

                        if (payoutEligible) {
                            console.log("Key won, will submit assertion", testKeys[i].toString());
                            winnerKeys.push(testKeys[i]);
                            testData.keyData[testKeys[i].toString()].winCount++;
                            testData.keyData[testKeys[i].toString()].wonChallenges.push(Number(currentChallengeId));

                            try {
                                console.log("Submitting assertion to won challenge", testKeys[i].toString(), currentChallengeId.toString());
                                await submitAssertionToChallenge(
                                    testKeys[i],
                                    currentChallengeId,
                                    lastChallenge.confirmData,
                                    cachedOperator
                                )

                            } catch (err) {
                                console.error("Error on submitAssertion", err);
                                // continue;
                            }
                        }
                    }

                    console.log("Create next challenge")
                    lastChallenge = {
                        assertionId: BigInt(counter + 15),
                        predecessorAssertionId: BigInt(counter + 14),
                        confirmData: generateRandomHexHash(),
                        assertionTimestamp: Math.floor(Date.now() / 1000),
                        challengerSignedHash: generateRandomHexHash()
                    }
                    counter++;
                    const tx = await refereeWriteChallenger.submitChallenge(
                        lastChallenge.assertionId,
                        lastChallenge.predecessorAssertionId,
                        lastChallenge.confirmData,
                        lastChallenge.assertionTimestamp,
                        lastChallenge.challengerSignedHash,
                    );

                    await tx.wait(1);
                    // await new Promise((resolve) => {
                    //     setTimeout(resolve, 1000);
                    // })
                    console.log("Create next challenge awaited");

                    if (winnerKeys.length > 0) {
                        console.log("Claiming for winnerKeys", winnerKeys.join(", "));
                        for (let i = 0; i < winnerKeys.length; i++) {
                            try {
                                await claimReward(winnerKeys[i], currentChallengeId, cachedOperator)
                                console.log("Claimed for ", winnerKeys[i].toString());
                            } catch (error) {
                                console.error("Failed to claim reward", winnerKeys[i], error)
                            }
                        }
                    }

                } catch (error) {
                    console.error(`[${new Date().toISOString()}] Error: ${(error as Error).message}`);
                    continue;
                }

            }

            fs.writeFileSync(reportPath, JSON.stringify(testData, null, 2));

            return Promise.resolve(); //End boot-challenger command here after NUM_ASSERTION_LISTENER_RETRIES restarts
        });
}