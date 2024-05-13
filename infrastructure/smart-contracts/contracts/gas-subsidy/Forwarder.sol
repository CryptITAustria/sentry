// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

contract Forwarder {
    // Domain separator schema for EIP-712
    string private constant _DOMAIN_SEPARATOR_SCHEMA =
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)";
    bytes32 private _DOMAIN_SEPARATOR;

    address private _owner;

    constructor() {
        _owner = msg.sender;
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(bytes("Forwarder")), // Name of the contract
                keccak256(bytes("1")), // Version
                chainId, // Chain ID
                address(this), // Address of the contract
                bytes32(0x00) // Salt
            )
        );
    }

    // Mapping to store nonces for each sender
    mapping(address => uint256) private nonces;

    struct ForwardRequest {
        address from; // an externally owned account making the request
        address to; // destination address, in this case the Receiver Contract
        uint256 value; // ETH Amount to transfer to destination
        uint256 gas; // gas limit for execution
        uint256 nonce; // an on-chain tracked transaction nonce
        bytes data; // the data to be sent to the destination
        uint256 validUntil; // the highest block number the request can be forwarded in, or 0 if request validity is not time-limited
    }

    bytes32 private constant _TYPEHASH =
        keccak256(
            "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"
        );

    function getNonce(address from) public view returns (uint256) {
        return nonces[from];
    }

    function verify(
        ForwardRequest calldata req,
        bytes calldata signature
    ) public view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                _DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        _TYPEHASH,
                        req.from,
                        req.to,
                        req.value,
                        req.gas,
                        req.nonce,
                        keccak256(req.data)
                    )
                )
            )
        );

        address signer = ecrecover(
            messageHash,
            uint8(signature[0]),
            bytes32(signature[1]),
            bytes32(signature[2])
        );
        return signer == req.from;
    }

    function execute(
        ForwardRequest calldata req,
        bytes calldata signature
    ) public payable returns (bool, bytes memory) {
        require(
            verify(req, signature),
            "TrustedForwarder: signature does not match request"
        );
        nonces[req.from] = req.nonce + 1;

        (bool success, bytes memory returndata) = req.to.call{
            gas: req.gas,
            value: req.value
        }(abi.encodePacked(req.data, req.from));

        if (gasleft() <= req.gas / 63) {
            // We explicitly trigger invalid opcode to consume all gas and bubble-up the effects, since
            // neither revert or assert consume all gas since Solidity 0.8.0
            // https://docs.soliditylang.org/en/v0.8.0/control-structures.html#panic-via-assert-and-error-via-require
            assembly {
                invalid()
            }
        }

        return (success, returndata);
    }
}
