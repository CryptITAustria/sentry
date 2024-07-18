import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {findWinningStateRoot} from "../Referee.mjs";
import {submitTestChallenge} from "../utils/submitTestChallenge.mjs";
import {mintBatchedLicenses, mintSingleLicense} from "../utils/mintLicenses.mjs";
import {createPool} from "../utils/createPool.mjs";

function ModelAirdropGasCostsForMaxTx(deployInfrastructure) {

    return function () {

        it("Check the amount of gas used in a maximum sized airdrop mint and stake transactions.", async function () {
            const { poolFactory, addr1, nodeLicense, referee, challenger, tinyKeysAirDrop, deployer } = await loadFixture(deployInfrastructure);

            // Mint Node Licenses
            const addr1MintedKeyIds = await mintBatchedLicenses(400n, nodeLicense, addr1);
            const keyToStart = [addr1MintedKeyIds[0]];
            
            const challengeId = 0;
            const keys = [addr1MintedKeyIds[0]];
            const winningStateRoot = await findWinningStateRoot(referee, keys, challengeId);

            // Submit First challenge
            const startingAssertion = 100;
            await submitTestChallenge(referee, challenger, startingAssertion, winningStateRoot);


            // Create a stake pool  with the key id minted in the fixture
            const stakingPoolAddress = await createPool(poolFactory, addr1, keyToStart);

            // Split the remaining keys into 2 batches
            const keyBatch1 = addr1MintedKeyIds.slice(1, 200);
            const keyBatch2 = addr1MintedKeyIds.slice(200, 400);

            // Stake the key bathes into the pool
            await poolFactory.connect(addr1).stakeKeys(stakingPoolAddress, keyBatch1);
            await poolFactory.connect(addr1).stakeKeys(stakingPoolAddress, keyBatch2);

            // Confirm Address balance and staked balance before airdrop
            const addr1BalanceBeforeAirdrop = await nodeLicense.balanceOf(await addr1.getAddress());
            const keysStakedBeforeAirdrop = await referee.assignedKeysToPoolCount(stakingPoolAddress);

            expect(addr1BalanceBeforeAirdrop).to.equal(401);
            expect(keysStakedBeforeAirdrop).to.equal(400);

            // Start Airdrop
            await tinyKeysAirDrop.connect(deployer).startAirdrop();
            const qtyToMint = 38;
            const qtyToStake = 40;
            const mintTx = await tinyKeysAirDrop.connect(deployer).processAirdropSegmentOnlyMint(qtyToMint);
            const mintReceipt = await mintTx.wait(1);
            console.log("Mint Gas Used: ", mintReceipt.gasUsed.toString());

            let keyIdsToStake = [];

            for (let i = 0; i <  qtyToStake; i++) {
                const keyIdToAdd = i + 1;
                keyIdsToStake.push(keyIdToAdd);
            }

            console.log("Key Ids to stake: ", keyIdsToStake.length);
            const stakeTx = await tinyKeysAirDrop.connect(deployer).processAirdropSegmentOnlyStake(keyIdsToStake);
            const stakeReceipt = await stakeTx.wait(1);
            console.log("Stake Gas Used: ", stakeReceipt.gasUsed.toString());


        }).timeout(300000);
    }
}

export function ModelAirdropGasCosts(deployInfrastructure) {
	return function () {
		describe("Check airdrop max qty per tx & mint costs", ModelAirdropGasCostsForMaxTx(deployInfrastructure).bind(this));
	}
}
