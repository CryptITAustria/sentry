import { sendSlackNotification } from "./sendSlackNotification.js";


export const sendPoolChallengeNotification = async (message: string): Promise<void> => {
        let stringifiedMessage = typeof message !== 'string' ? JSON.stringify(message) : message;
		const poolChallengeWebhookUrl = process.env.POOL_CHALLENGE_SLACK_WEBHOOK_URL || '';
		const poolChallengeSlackOAuthToken = process.env.POOL_CHALLENGE_SLACK_OAUTH_TOKEN || '';
		sendSlackNotification(poolChallengeWebhookUrl, stringifiedMessage, poolChallengeSlackOAuthToken);
}
