import axios from "axios";

export const sendSlackNotification = async (webhookUrl: string, message: string, oAuthToken: string): Promise<void> => {
    if (!webhookUrl) {
        throw new Error('SLACK_WEBHOOK_URL is not defined');
    }

    const headers = {
        'Authorization': `Bearer ${oAuthToken}`,
        'Content-Type': 'application/json'
    };

    const response = await axios.post(webhookUrl, {
        text: message
    }, { headers });

    if (response.status !== 200) {
        throw new Error(`Failed to send slack notification: ${response.status}`);
    }
}
