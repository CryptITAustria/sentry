// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./upgrades/referee/Referee9.sol";
import "./upgrades/node-license/NodeLicense8.sol";
import "./upgrades/pool-factory/PoolFactory2.sol";

/**
 * @title OperatorReader
 * @dev This contract allows front-end consumers to read the state of multiple variables
 * with a single blockchain call. It acts as an intermediary, calling other contracts
 * and returning their states.
 */
contract OperatorReader is AccessControlUpgradeable {

    /// @notice Address of the Referee contract
    address public referenceContract;

    /// @notice Address of the PoolFactory contract
    address public stakePoolFactory;

    /// @notice Address of the NodeLicense contract
    address public nodeLicenseContract;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[500] private __gap;

    /**
     * @dev Initializes the contract, setting up access control and granting the DEFAULT_ADMIN_ROLE to the deployer.
     */
    function initialize(
        address _referenceContract,
        address _stakePoolFactory,
        address _nodeLicenseContract
    ) public initializer {
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        referenceContract = _referenceContract;
        stakePoolFactory = _stakePoolFactory;
        nodeLicenseContract = _nodeLicenseContract;
    }

    /**
     * @dev Retrieves all owner addresses for a given operator.
     * @param operator The address of the operator.
     * @return ownerAddresses An array of owner addresses associated with the operator.
     */
    function getAllOwnersForAnOperator(address operator) public view returns (address[] memory ownerAddresses) {
        Referee9 referee = Referee9(referenceContract);
        uint256 ownerCount = referee.getOwnerCountForOperator(operator);
        ownerAddresses = new address[](ownerCount);

        for (uint256 i = 0; i < ownerCount; i++) {
            address owner = referee.getOwnerForOperatorAtIndex(operator, i);
            ownerAddresses[i] = owner;
        }
    }

    /**
     * @dev Retrieves the Referee contract configuration.
     * @return maxStakeAmountPerLicense The maximum stake amount per license.
     * @return maxKeysPerPool The maximum number of keys per pool.
     * @return stakeAmountTierThresholds An array of stake amount tier thresholds.
     * @return stakeAmountBoostFactors An array of stake amount boost factors.
     */
    function getRefereeConfig() public view returns (
        uint256 maxStakeAmountPerLicense,
        uint256 maxKeysPerPool,
        uint256[] memory stakeAmountTierThresholds,
        uint256[] memory stakeAmountBoostFactors
    ) {
        Referee9 referee = Referee9(referenceContract);
        maxStakeAmountPerLicense = referee.maxStakeAmountPerLicense();
        maxKeysPerPool = referee.maxKeysPerPool();
        uint256 tierCount = 4;
        
        stakeAmountTierThresholds = new uint256[](tierCount);
        stakeAmountBoostFactors = new uint256[](tierCount);

        for (uint256 i = 0; i < tierCount; i++) {
            stakeAmountTierThresholds[i] = referee.stakeAmountTierThresholds(i);
            stakeAmountBoostFactors[i] = referee.stakeAmountBoostFactors(i);
        }
    }

    /**
     * @dev Retrieves stake amounts for multiple owners.
     * @param owners An array of owner addresses.
     * @return keyCounts An array of total key counts for each owner.
     * @return stakedKeyCounts An array of staked key counts for each owner.
     * @return v1EsXaiStakeAmounts An array of v1EsXai stake amounts for each owner.
     */
    function getOwnerStakeAmounts(address[] memory owners) public view returns (uint256[] memory keyCounts, uint256[] memory stakedKeyCounts, uint256[] memory v1EsXaiStakeAmounts) {
        Referee9 referee = Referee9(referenceContract);
        NodeLicense8 nodeLicense = NodeLicense8(nodeLicenseContract);
        keyCounts = new uint256[](owners.length);
        stakedKeyCounts = new uint256[](owners.length);
        v1EsXaiStakeAmounts = new uint256[](owners.length);

        for (uint256 i = 0; i < owners.length; i++) {
            address owner = owners[i];
            uint256 totalKeys = nodeLicense.balanceOf(owner);
            uint256 stakedKeys = referee.assignedKeysOfUserCount(owner); 
            uint256 v1EsXaiStakeAmount = referee.stakedAmounts(owner); 
            keyCounts[i] = totalKeys;
            stakedKeyCounts[i] = stakedKeys;
            v1EsXaiStakeAmounts[i] = v1EsXaiStakeAmount;
        }
    }

    /**
     * @dev Retrieves operator keys and associated information.
     * @param operator The address of the operator.
     * @return ownerAddresses An array of owner addresses.
     * @return keyIds An array of key IDs.
     * @return mintTimestamps An array of mint timestamps for each key.
     * @return pools An array of pool addresses.
     */
    function getOperatorKeys(address operator, uint256 maxKeys) public view returns (address[] memory ownerAddresses, uint256[] memory keyIds, uint256[] memory mintTimestamps, address[] memory pools) {
       ownerAddresses = getAllOwnersForAnOperator(operator);
        uint256 count = 0; // Keep track of the number of unstaked keys retrieved

        // Since we don't know how many keys each owner has, we need
        // to create temporary arrays to store the values before filtering
        address[] memory tempOwnerAddresses = new address[](maxKeys);
        uint256[] memory tempKeyIds = new uint256[](maxKeys);
        uint256[] memory tempMintTimestamps = new uint256[](maxKeys);

        // Loop through each owner and retrieve their unstaked keys
        for (uint256 i = 0; i < ownerAddresses.length; i++) {
            address owner = ownerAddresses[i];
            // Retrieve unstaked keys for the owner
            (uint256 [] memory ownerKeys, uint256 [] memory ownerMintTimestamps) = getUnstakedKeysForOwner(ownerAddresses[i], maxKeys);

            // Add the owner keys to the temporary arrays
            for (uint256 j = 0; j < ownerKeys.length; j++) {
                tempOwnerAddresses[count] = owner;
                tempKeyIds[count] = ownerKeys[j];
                tempMintTimestamps[count] = ownerMintTimestamps[j];
                // Increment the count
                count++;
                // If we've reached the max number of keys, break out of the loop
                if (count >= maxKeys) {
                    break;
                }
            }
        }
        // Filter out empty values from the temporary arrays
        (ownerAddresses, keyIds, mintTimestamps) = filterEmptyValues(tempOwnerAddresses, tempKeyIds, tempMintTimestamps, count);

        // Retrieve pools for the operator
        (pools) = getPoolsAsOwnerOperator(operator);
    }

    /**
     * @dev Filters out empty values from arrays.
     * @param ownerAddresses An array of owner addresses.
     * @param keyIds An array of key IDs.
     * @param mintTimestamps An array of mint timestamps.
     * @param count The number of valid entries.
     * @return filteredOwnerAddresses The filtered array of owner addresses.
     * @return filteredKeyIds The filtered array of key IDs.
     * @return filteredMintTimestamps The filtered array of mint timestamps.
     */
    function filterEmptyValues(address[] memory ownerAddresses, uint256[] memory keyIds, uint256[] memory mintTimestamps, uint256 count) public pure returns (address[] memory filteredOwnerAddresses, uint256[] memory filteredKeyIds, uint256[] memory filteredMintTimestamps) {
        // Create new arrays with the correct sizes
        filteredOwnerAddresses = new address[](count);
        filteredKeyIds = new uint256[](count);
        filteredMintTimestamps = new uint256[](count);

        // Copy the values from the temporary arrays to the new arrays
        for (uint256 i = 0; i < count; i++) {
            filteredOwnerAddresses[i] = ownerAddresses[i];
            filteredKeyIds[i] = keyIds[i];
            filteredMintTimestamps[i] = mintTimestamps[i];
        }     
    }

    /**
     * @dev Retrieves the latest challenge from the Referee contract.
     * @return challenge The latest Challenge struct.
     */
    function getLatestChallenge() public view returns (Referee9.Challenge memory challenge, uint256 latestChallenge) {
        Referee9 referee = Referee9(referenceContract);
        // Get the latest challenge number
        latestChallenge = referee.challengeCounter();
        // Get the latest challenge
        challenge = referee.getChallenge(latestChallenge);
    }

    /**
     * @dev Retrieves a specific challenge from the Referee contract.
     * @param challengeNumber The number of the challenge to retrieve.
     * @return challenge The Challenge struct for the specified challenge number.
     */
    function getSpecificChallenge(uint256 challengeNumber) public view returns (Referee9.Challenge memory challenge) {
        Referee9 referee = Referee9(referenceContract);
        // Get the specific challenge
        return referee.getChallenge(challengeNumber);
    }
    
    /**
     * @dev Retrieves unstaked keys for a specific owner.
     * @param owner The address of the owner.
     * @param maxKeys The maximum number of keys to retrieve.
     * @return keyIds An array of unstaked key IDs.
     * @return mintTimestamps An array of mint timestamps for the unstaked keys.
     */
    function getUnstakedKeysForOwner(address owner, uint256 maxKeys) public view returns (uint256[] memory keyIds, uint256[] memory mintTimestamps) {
        Referee9 referee = Referee9(referenceContract);
        NodeLicense8 nodeLicense = NodeLicense8(nodeLicenseContract);

        // Get the balance of the owner
        uint256 balance = nodeLicense.balanceOf(owner);

        // Determine the maximum number of keys to retrieve
        uint256 maxToRetrieve = balance < maxKeys ? balance : maxKeys;

        // Create temporary arrays to store the values before filtering
        uint256[] memory tempKeyIds = new uint256[](balance);
        uint256[] memory tempMintTimestamps = new uint256[](balance);

        // Initialize a count to keep track of the number of unstaked keys retrieved
        uint256 count = 0;

        // Loop through each key and retrieve the unstaked keys
        for (uint256 i = 0; i < balance; i++) {

            // Retrieve the owner's key Id(s)
            uint256 keyId = nodeLicense.tokenOfOwnerByIndex(owner, i);

            // Retrieve the pool associated with the key
            address pool = referee.assignedKeyToPool(keyId);

            // If the pool is not set, the key is unstaked
            if (pool == address(0)) {

                // Retrieve the mint timestamp for the key
                uint256 mintTimestamp = nodeLicense.getMintTimestamp(keyId);

                // Add the key to the temporary arrays
                tempKeyIds[i] = keyId;
                tempMintTimestamps[i] = mintTimestamp;

                // Increment the count
                count++;

                // If we've reached the max number of keys, break out of the loop
                if (count >= maxToRetrieve) {
                    break;
                }
            }
        }

        // Filter out empty values from the temporary arrays
        // Start by creating new arrays with the correct sizes
        keyIds = new uint256[](count);
        mintTimestamps = new uint256[](count);

        // Copy the values from the temporary arrays to the new arrays
        for (uint256 i = 0; i < count; i++) {
            keyIds[i] = tempKeyIds[i];
            mintTimestamps[i] = tempMintTimestamps[i];
        }
    }

    /**
     * @dev Retrieves pools and their stake amounts for an owner-operator.
     * @param operator The address of the operator.
     * @return poolAddresses An array of pool addresses.
     */
    function getPoolsAsOwnerOperator(address operator) public view returns (address[] memory poolAddresses) {
        PoolFactory2 poolFactory = PoolFactory2(stakePoolFactory);
        
        // Get the pool addresses for the operator
        poolAddresses = poolFactory.getPoolIndicesOfUser(operator);
    }
}