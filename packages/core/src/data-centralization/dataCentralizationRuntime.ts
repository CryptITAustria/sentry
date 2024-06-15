import mongoose from 'mongoose';
import { EventListenerError, resilientEventListener } from '../utils/resilientEventListener.js';
import { LogDescription } from 'ethers';
import { config } from '../config.js';
import { PoolFactoryAbi } from '../abis/PoolFactoryAbi.js';
import { updatePoolInDB } from './updatePoolInDB.js';
import { retry } from '../utils/retry.js';
import { listenForChallenges } from '../operator/listenForChallenges.js';
import { Challenge } from '../challenger/getChallenge.js';
import { IPool, PoolSchema } from './types.js';
import { getRewardRatesFromGraph } from '../subgraph/getRewardRatesFromGraph.js';
import { sendSlackNotification } from '../utils/index.js';

/**
 * Arguments required to initialize the data centralization runtime.
 * @param {string} mongoUri - The URI for connecting to MongoDB.
 * @param {(log: string) => void} [logFunction] - An optional logging function to capture runtime logs.
 */
interface DataCentralizationRuntimeArgs {
	mongoUri: string;
	slackWebHookUrl: string;
	slackOAuthToken: string;
	logFunction?: (log: string) => void;
}

const toSaveString = (obj: any) => {
	return JSON.stringify(obj, (key, value) =>
		typeof value === 'bigint'
			? value.toString()
			: value // return everything else unchanged
	);
}

/**
 * Initializes the data centralization runtime with MongoDB and event listeners.
 * @param {DataCentralizationRuntimeArgs} args - The arguments required for the runtime.
 * @returns {Promise<() => Promise<void>>} A function to stop the runtime.
 */
export async function dataCentralizationRuntime({
	mongoUri,
	slackWebHookUrl,
	slackOAuthToken,
	logFunction = (_) => { }
}: DataCentralizationRuntimeArgs): Promise<() => Promise<void>> {

	// Establish a connection to MongoDB via mongoose.
	try {
		await mongoose.connect(mongoUri);
		logFunction(`Connected to MongoDB`);
	} catch (error) {
		logFunction(`Failed to connect to MongoDB: ${error}`);
		throw new Error(`Failed to connect to MongoDB: ${error}`);
	}

	// Establish a single event listener for multiple events for data centralization.
	// Map poolfactory event to index of pool address in event logs
	const eventToPoolAddressInLog: { [eventName: string]: number } = {
		'PoolCreated': 1,
		'StakeEsXai': 1,
		'UnstakeEsXai': 1,
		'StakeKeys': 1,
		'UnstakeKeys': 1,
		'UpdatePoolDelegate': 1,
		'UnstakeRequestStarted': 1,
		'UpdateShares': 0,
		'UpdateMetadata': 0
	}

	const stopListener = resilientEventListener({
		rpcUrl: config.arbitrumOneWebSocketUrl,
		contractAddress: config.poolFactoryAddress,
		abi: PoolFactoryAbi,
		eventName: Object.keys(eventToPoolAddressInLog),
		log: logFunction,
		callback: (log: LogDescription | null, err?: EventListenerError) => {
			if (err) {
				logFunction(`Error listening to event: ${err.message}`);
			} else if (log) {
				logFunction(`Event ${log.name} received: ${toSaveString(log.args)}`);

				const poolAddress = log.args[eventToPoolAddressInLog[log.name]];
				if (!poolAddress) {
					logFunction(`Error finding poolAddress on event ${log.name}`);
					return;
				}

				retry(() => updatePoolInDB(poolAddress, log.name), 3)
					.then(() => {
						logFunction("Updated pool:" + poolAddress)
					})
					.catch(err => {
						logFunction(`Error updating pool ${poolAddress} on event ${log.name}, error: ${err}`);
					});

			} else {
				logFunction(`Received null log description.`);
			}
		},
	}).stop;

	const closeChallengeListener = listenForChallenges(async (challengeNumber: bigint, challenge: Challenge, event?: any) => {
		try {
		const PoolModel = mongoose.models.Pool || mongoose.model<IPool>('Pool', PoolSchema);
		const startTime = new Date().toISOString();

		const pools = await PoolModel.find({}).select("poolAddress esXaiRewardRate keyRewardRate").lean();

		const slackStartMessage = `Found ${pools.length} pools to update. Starting to update @ ${startTime}`;
		sendSlackNotification(slackWebHookUrl, slackStartMessage, slackOAuthToken);

		const mappedPools: { [poolAddress: string]: { esXaiRewardRate?: number, keyRewardRate?: number } } = {};

		pools.forEach(p => {
			mappedPools[p.poolAddress] = {
				esXaiRewardRate: p.esXaiRewardRate,
				keyRewardRate: p.keyRewardRate
			};
		});

		const startRewardRateTimestamp = new Date().getTime();
		const startRewardRatesMessage = `Started getting reward rates @ ${new Date(startRewardRateTimestamp).toISOString()}`;
		sendSlackNotification(slackWebHookUrl, startRewardRatesMessage, slackOAuthToken);
		
		const updatedPools = await getRewardRatesFromGraph([]);

		const endRewardRateTimestamp = new Date().getTime();
		const durationRewardRates = endRewardRateTimestamp - startRewardRateTimestamp;
		const endRewardRatesMessage = `Finished getting reward rates @ ${new Date(endRewardRateTimestamp).toISOString()} taking ${Math.floor(durationRewardRates/1000)} seconds.`;
		sendSlackNotification(slackWebHookUrl,endRewardRatesMessage, slackOAuthToken);

		const startUpdateTimestamp = new Date().getTime();
		const startUpdateMessage = `Started updating MongoDb @ ${new Date(startUpdateTimestamp).toISOString()}`;
		sendSlackNotification(slackWebHookUrl, startUpdateMessage, slackOAuthToken);

		for (const updatedPool of updatedPools) {
			if (!mappedPools[updatedPool.poolAddress] ||
				mappedPools[updatedPool.poolAddress].esXaiRewardRate == undefined || 
				mappedPools[updatedPool.poolAddress].esXaiRewardRate != updatedPool.averageDailyRewardPerEsXai || 
				mappedPools[updatedPool.poolAddress].keyRewardRate == undefined || 
				mappedPools[updatedPool.poolAddress].keyRewardRate != updatedPool.averageDailyRewardPerKey) {

				await PoolModel.updateOne(
					{ poolAddress: updatedPool.poolAddress },
					{
						$set: {
							esXaiRewardRate: updatedPool.averageDailyRewardPerEsXai,
							keyRewardRate: updatedPool.averageDailyRewardPerKey
						}
					},
				);
			}
		}

		const endUpdateTimestamp = new Date().getTime();
		const durationUpdate = endUpdateTimestamp - startUpdateTimestamp;
		const endUpdateMessage = `Finished updating MongoDb @ ${new Date(endUpdateTimestamp).toISOString()} taking ${Math.floor(durationUpdate/1000)} seconds.`;
		sendSlackNotification(slackWebHookUrl, endUpdateMessage, slackOAuthToken);

		const endTime = new Date().toISOString();
		const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
		const slackEndMessage = `Updated ${pools.length} pools. Started @ ${startTime} and ended @ ${endTime} taking ${Math.floor(duration/1000)} seconds.`;
		sendSlackNotification(slackWebHookUrl, slackEndMessage, slackOAuthToken);

		} catch (error) {
			const errorTime = new Date().toISOString();
			const slackErrorMesssage = `Error updating pools: ${JSON.stringify(error)} @ ${errorTime}`;
			sendSlackNotification(slackWebHookUrl, slackErrorMesssage, slackOAuthToken);		
		}
	});

	/**
	 * Stops the data centralization runtime.
	 * @returns {Promise<void>} A promise that resolves when the runtime is successfully stopped.
	 */
	return async () => {
		// Disconnect from MongoDB.
		await mongoose.disconnect();
		logFunction('Disconnected from MongoDB.');
		closeChallengeListener();
		// Remove event listener listener.
		stopListener();
		logFunction('Event listener removed.');
	};
}