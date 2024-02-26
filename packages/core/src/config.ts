export let config = {
  "arbitrumBlockExplorer": "https://arbiscan.io",
  "arbitrumGoerliBlockExplorer": "https://goerli.arbiscan.io",
  "arbitrumOneJsonRpcUrl": "https://arb-sepolia.g.alchemy.com/v2/8aXl_Mw4FGFlgxQO8Jz7FVPh2cg5m2_B",
  "arbitrumOneWebSocketUrl": "wss://arb-sepolia.g.alchemy.com/v2/8aXl_Mw4FGFlgxQO8Jz7FVPh2cg5m2_B",
  "defaultRpcUrl": "https://arb-sepolia.g.alchemy.com/v2/8aXl_Mw4FGFlgxQO8Jz7FVPh2cg5m2_B",
  "esXaiAddress": "0x5776784C2012887D1f2FA17281E406643CBa5330",
  "esXaiDeployedBlockNumber": null,
  "esXaiImplementationAddress": "0x8d6c063656b00e5c37ce007c0f99848d58f19d6b",
  "gasSubsidyAddress": "0x91401a742b40802673b85AaEFeE0c999942Dc17c",
  "gasSubsidyDeployedBlockNumber": null,
  "gasSubsidyImplementationAddress": "0xf208798482f0b12c8767bc03cc0f145d18bece6a",
  "nodeLicenseAddress": "0x07C05C6459B0F86A6aBB3DB71C259595d22af3C2",
  "nodeLicenseDeployedBlockNumber": null,
  "nodeLicenseImplementationAddress": "0xf765452e587ad0ae785dc984963897c05d4c8c71",
  "refereeAddress": "0x41Bdf5c462e79Cef056B12B801Fd854c13e2BEE6",
  "refereeDeployedBlockNumber": null,
  "refereeImplementationAddress": "0x29a7b907fdf4a9235f46d891b7aa1e7d3d35a3b6",
  "rollupAddress": "0xC47DacFbAa80Bd9D8112F4e8069482c2A3221336",
  "xaiAddress": "0x724E98F16aC707130664bb00F4397406F74732D0",
  "xaiDeployedBlockNumber": null,
  "xaiImplementationAddress": "0x3fb787101dc6be47cfe18aeee15404dcc842e6af",
  "xaiGaslessClaimAddress": "0x149107dEB70b9514930d8e454Fc32E77C5ABafE0",
  "xaiRedEnvelope2024Address": "0x080C2e59e963959Bbe9Ea064d1bcBc881F380Ff2",
  "xaiRedEnvelope2024ImplementationAddress": "0xf26Af8313cB039A58b86c2Ab7aA5c540EcEEB70f"
};

export function setConfig(_config: any) { config = _config; }