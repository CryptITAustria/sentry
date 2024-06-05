import axios from "axios";
// ############################
// ##### TODO: COMPLETE!! #####
// ############################

type MetaTxRequest = {
    from: string;
    to: string;
    value: string;
    gas: string;
    nonce: string;
    data: string;
};

/**
 * ## Forward a signed transaction according to the ERC-2771 standard
 * @param transaction The transaction to forward according to ERC-2771
 * @param signature Signature of the transaction
 * 
 * @returns The transaction hash for the forwarded transaction.
 */
export async function forwardMetaTransaction(transaction: MetaTxRequest, signature: string): Promise<string> {

    /*   throw new Error('not implemented'); */
    /*

    const toAddress = transaction.to

    // Verify To contract with ProjectContracts from ThrirdWebRelayer config
    if (toAddress not in ThrirdWebRelayer config)

    // get the project to forward to
    toAddress = transaction.to
    project = db.getProject(toAddress) // only get the fields we need (relayerId, ...)

    // Check request.from (User) Quota with our Databse

    // Check Backendwallet Balance

    */

    //TODO add correct Forwarder based on projectId
    const forwarderAddress = "0x61f97dff786d5739109bA1B6cD3854c21B7378Ee";

    const metaTransaction = {
        type: "forward",
        request: {
            from: transaction.from,
            to: transaction.to,
            value: transaction.value,
            gas: transaction.gas,
            nonce: transaction.nonce,
            data: transaction.data
        },
        signature: signature,
        forwarderAddress: forwarderAddress
    };

    const config = {
        headers: {
            Authorization: `Bearer ${process.env.THIRDWEB_BEARER_TOKEN}`
        }
    };

    try {
        //TODO add relayerId from Project
        const response = await axios.post(`https://bb2047c2.engine-usw2.thirdweb.com/relayer/b64f2499-a16f-48cd-b988-f309eb31f91c`, metaTransaction, config);
        const queueId = response.data.result.queueId;

        if (queueId) {
            // Further processing with queueId
            await processQueueId(queueId)
        }

        return queueId;
    } catch (error) {
        throw new Error("Transaction failed:", error)
    }
}

async function recallUntilMined(callback: () => Promise<Response>, conditionFn: (result) => boolean, interval: number = 1500, maxAttempts: number = 10) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const result = await callback().catch(error => { throw error; });
        if (conditionFn(result)) return result;
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error("Maximum number of retries exceeded");
};

const processQueueId = async (queueId: string) => {
    // Logic for further processing with the queueId
    if (!queueId) {
        throw new Error("No queueId found");
    }

    const config = {
        headers: {
            Authorization: `Bearer ${process.env.THIRDWEB_BEARER_TOKEN}`
        }
    };

    try {
        await new Promise((resolve) => {
            setTimeout(resolve, 1500)
        })
        //TODO add relayerId from Project
        const result = await recallUntilMined(
            () => axios.get(`https://bb2047c2.engine-usw2.thirdweb.com/transaction/status/${queueId}`, config),
            result => result && result.data.result.status == 'mined'
        );



        if (result) {
            const gasSpent = calculateGasSpent(result.data.result.gasLimit, result.data.result.gasPrice);
            const transactionData = result.data.result;

            return { transactionData, queueId, gasSpent };
        }
    } catch (error) {
        throw new Error("ERROR on processing queueId", error)
    }
};

const calculateGasSpent = (gasLimit: number, gasPrice: number) => {
    const gasSpentWei = gasLimit * gasPrice;
    const gasSpent = gasSpentWei / 10 ** 18;
    return gasSpent;
};