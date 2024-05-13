import { forwarderAbi } from "@/abi/forwarderAbi";
import { Wallet, ethers } from "ethers";

const FORWARDER_CONTRACT_ADDRESS = "0x0"

type ForwardRequest = {
    from: string; // an externally owned account making the request
    to: string; // destination address, in this case the Receiver Contract
    value: bigint; // ETH Amount to transfer to destination
    gas: bigint; // gas limit for execution
    nonce: bigint; // an on-chain tracked transaction nonce
    data: string; // the data to be sent to the destination
    validUntil: bigint; // the highest block number the request can be forwarded in, or 0 if request validity is not time-limited
}

/**
 * Forward a user signed transaction object to the forwarder contract to be executed
 * This way we can pay the gas for the transaction but the custom contract will use the user that signed as msg.sender
 *
 * @param request - The request object to be sent to the Forwarder's execute function
 * @param signature - The signed hash of the request by the users privateKey.
 * @param signer - The relayer wallet that will pay the gas for the transaction
 */
export async function executeMetaTransaction(request: ForwardRequest, signature: string, signer: Wallet) {

    const provider = new ethers.JsonRpcProvider(process.env.RPC_ADDRESS, signer);
    const forwarderContract = new ethers.Contract(FORWARDER_CONTRACT_ADDRESS, forwarderAbi, provider);

    // Execute the meta transaction
    await forwarderContract.execute(request, signature);
};
