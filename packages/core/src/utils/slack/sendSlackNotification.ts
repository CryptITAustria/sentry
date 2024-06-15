import axios from "axios";

export const sendSlackNotification = async (webhookUrl: string, message: string, oAuthToken: string): Promise<void> => {
    if (!webhookUrl || webhookUrl.length === 0) {
        console.log(`Failed to send slack notification, missing webhook url.`);
        console.log(`Failed message: ${message}`);   
    }

    if (!oAuthToken || oAuthToken.length === 0) {
        console.log(`Failed to send slack notification, missing oAuth token.`);
        console.log(`Failed message: ${message}`);    
    }

    const headers = {
        'Authorization': `Bearer ${oAuthToken}`,
        'Content-Type': 'application/json'
    };

    try {

    const response = await axios.post(webhookUrl, {
        text: message
    }, { headers });

    if (response.status !== 200) {
        console.log(`Failed to send slack notification webhook: ${webhookUrl}`);
        console.log(`Failed to send slack notification message: ${message}`);   
    }
        
    } catch (error) {
        console.error(`Failed to send slack notification webhook: ${webhookUrl}`);
        console.error(`Failed to send slack notification message: ${message}`);        
    }
}
