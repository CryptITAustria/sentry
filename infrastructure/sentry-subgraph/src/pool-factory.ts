import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  StakeKeys,
  UnstakeKeys,
  PoolCreated,
  UpdatePoolDelegate,
  StakeEsXai,
  UnstakeEsXai,
  UpdateShares,
  UpdateMetadata,
  UnstakeRequestStarted,
  PoolFactory,
  Initialized,
  UpdateDelayPeriods,
  ClaimFromPool
} from "../generated/PoolFactory/PoolFactory"
import {
  SentryKey,
  PoolInfo,
  UnstakeRequest,
  PoolFactoryConfig,
  SentryWallet,
} from "../generated/schema"
import { getInputFromEvent } from "./utils/getInputFromEvent";
import { getTxSignatureFromEvent } from "./utils/getTxSignatureFromEvent";

export function handleInitialized(event: Initialized): void {

  let poolConfig = PoolFactoryConfig.load("PoolFactoryConfig");

  if (!poolConfig) {
    poolConfig = new PoolFactoryConfig("PoolFactoryConfig");
  }

  const poolFactory = PoolFactory.bind(event.address)
  poolConfig.version = BigInt.fromI32(event.params.version)
  poolConfig.unstakeKeysDelayPeriod = poolFactory.unstakeKeysDelayPeriod()
  poolConfig.unstakeGenesisKeyDelayPeriod = poolFactory.unstakeGenesisKeyDelayPeriod()
  poolConfig.unstakeEsXaiDelayPeriod = poolFactory.unstakeEsXaiDelayPeriod()
  poolConfig.updateRewardBreakdownDelayPeriod = poolFactory.updateRewardBreakdownDelayPeriod()
  poolConfig.save();
}

export function handleStakeKeys(event: StakeKeys): void {

  let pool = PoolInfo.load(event.params.pool.toHexString());
  if (pool) {
    if (pool.owner == event.params.user) {
      pool.ownerStakedKeys = pool.ownerStakedKeys.plus(event.params.amount)
    }
    pool.totalStakedKeyAmount = event.params.totalKeysStaked

    if (pool.updateSharesTimestamp.ge(event.block.timestamp)) {
      pool.ownerShare = pool.pendingShares[0];
      pool.keyBucketShare = pool.pendingShares[1];
      pool.stakedBucketShare = pool.pendingShares[2];

      pool.updateSharesTimestamp = BigInt.fromI32(0);
      pool.pendingShares = [BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0)];
    }

    pool.save()
  }

  let sentryWallet = SentryWallet.load(event.params.user.toHexString())
  if (sentryWallet) {
    sentryWallet.stakedKeyCount = sentryWallet.stakedKeyCount.plus(event.params.amount)
    sentryWallet.save();
  }

  const dataToDecode = getInputFromEvent(event)
  const decoded = ethereum.decode('(address,uint256[])', dataToDecode);
  if (decoded) {
    let nodeLicenseIds = decoded.toTuple()[1].toBigIntArray();
    for (let i = 0; i < nodeLicenseIds.length; i++) {
      let sentryKey = SentryKey.load(nodeLicenseIds[i].toString())
      if (sentryKey) {
        sentryKey.assignedPool = event.params.pool
        sentryKey.save()
      }
    }
  }
}

export function handleUnstakeKeys(event: UnstakeKeys): void {

  let pool = PoolInfo.load(event.params.pool.toHexString());
  if (pool) {
    if (pool.owner == event.params.user) {
      pool.ownerStakedKeys = pool.ownerStakedKeys.minus(event.params.amount)
    }
    pool.totalStakedKeyAmount = event.params.totalKeysStaked

    if (pool.updateSharesTimestamp.ge(event.block.timestamp)) {
      pool.ownerShare = pool.pendingShares[0];
      pool.keyBucketShare = pool.pendingShares[1];
      pool.stakedBucketShare = pool.pendingShares[2];

      pool.updateSharesTimestamp = BigInt.fromI32(0);
      pool.pendingShares = [BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0)];
    }

    pool.save()
  }

  let sentryWallet = SentryWallet.load(event.params.user.toHexString())
  if (sentryWallet) {
    sentryWallet.stakedKeyCount = sentryWallet.stakedKeyCount.minus(event.params.amount)
    sentryWallet.save();
  }

  const dataToDecode = getInputFromEvent(event)
  const decoded = ethereum.decode('(address,uint256,uint256[])', dataToDecode);
  if (decoded) {
    let nodeLicenseIds = decoded.toTuple()[2].toBigIntArray();
    for (let i = 0; i < nodeLicenseIds.length; i++) {
      let sentryKey = SentryKey.load(nodeLicenseIds[i].toString())
      if (sentryKey) {
        sentryKey.assignedPool = new Address(0)
        sentryKey.save()
      }
    }

    let index = decoded.toTuple()[1].toBigInt()
    let unstakeRequest = UnstakeRequest.load(event.params.pool.toHexString() + event.params.user.toHexString() + index.toString())
    if (unstakeRequest) {
      unstakeRequest.open = false
      unstakeRequest.completeTime = event.block.timestamp
      unstakeRequest.save();
    } else {
      log.warning("Could not find unstake request!", [])
      log.warning("pool: " + event.params.pool.toHexString() + ", user: " + event.params.user.toHexString() + ", index: " + index.toString() + ", TX: " + event.transaction.hash.toHexString(), [])
    }
  }
} 

export function handlePoolCreated(event: PoolCreated): void {
  const dataToDecode = getInputFromEvent(event)
  const decoded = ethereum.decode('(address,uint256[],uint32[3],string[3],string[],string[2][2])', dataToDecode);
  if (decoded) {
    const pool = new PoolInfo(event.params.poolAddress.toHexString())
    const tuple = decoded.toTuple();
    pool.address = event.params.poolAddress
    pool.owner = event.params.poolOwner
    pool.delegateAddress = tuple[0].toAddress();
    pool.totalStakedEsXaiAmount = BigInt.fromI32(0);
    pool.totalStakedKeyAmount = event.params.stakedKeyCount;
    pool.ownerShare = tuple[2].toBigIntArray()[0];
    pool.keyBucketShare = tuple[2].toBigIntArray()[1];
    pool.stakedBucketShare = tuple[2].toBigIntArray()[2];
    pool.updateSharesTimestamp = BigInt.fromI32(0);
    pool.pendingShares = [BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0)];
    pool.metadata = tuple[3].toStringArray();
    pool.socials = tuple[4].toStringArray();
    pool.ownerStakedKeys = pool.totalStakedKeyAmount;
    pool.ownerRequestedUnstakeKeyAmount = BigInt.fromI32(0);
    pool.ownerLatestUnstakeRequestCompletionTime = BigInt.fromI32(0);
    pool.save()

  } else {
    //This is just a debug solution, we should be able to decode the transaction inputs.
    log.warning("Failed to decode pool create input: PoolAddress: " + event.params.poolAddress.toHexString() + ", TX: " + event.transaction.hash.toHexString(), []);
  }
}

export function handleUpdatePoolDelegate(event: UpdatePoolDelegate): void {
  const pool = PoolInfo.load(event.params.pool.toHexString())
  if (pool) {
    pool.delegateAddress = event.params.delegate;
    pool.save()
  }
}

export function handleStakeEsXai(event: StakeEsXai): void {
  const pool = PoolInfo.load(event.params.pool.toHexString())
  if (pool) {
    pool.totalStakedEsXaiAmount = event.params.totalEsXaiStaked

    if (pool.updateSharesTimestamp.ge(event.block.timestamp)) {
      pool.ownerShare = pool.pendingShares[0];
      pool.keyBucketShare = pool.pendingShares[1];
      pool.stakedBucketShare = pool.pendingShares[2];

      pool.updateSharesTimestamp = BigInt.fromI32(0);
      pool.pendingShares = [BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0)];
    }

    pool.save()
  }


  let sentryWallet = SentryWallet.load(event.params.user.toHexString())

  if (!sentryWallet) {
    sentryWallet = new SentryWallet(event.params.user.toHexString())
    sentryWallet.address = event.params.user
    sentryWallet.isKYCApproved = false
    sentryWallet.approvedOperators = []
    sentryWallet.v1EsXaiStakeAmount = BigInt.fromI32(0)
    sentryWallet.esXaiStakeAmount = BigInt.fromI32(0)
    sentryWallet.keyCount = BigInt.fromI32(0)
    sentryWallet.stakedKeyCount = BigInt.fromI32(0)
    sentryWallet.keyCount = BigInt.fromI32(0)
  }

  sentryWallet.esXaiStakeAmount = sentryWallet.esXaiStakeAmount.plus(event.params.amount)
  sentryWallet.save();
}

export function handleUnstakeEsXai(event: UnstakeEsXai): void {
  const pool = PoolInfo.load(event.params.pool.toHexString())
  if (pool) {
    pool.totalStakedEsXaiAmount = event.params.totalEsXaiStaked

    if (pool.updateSharesTimestamp.ge(event.block.timestamp)) {
      pool.ownerShare = pool.pendingShares[0];
      pool.keyBucketShare = pool.pendingShares[1];
      pool.stakedBucketShare = pool.pendingShares[2];

      pool.updateSharesTimestamp = BigInt.fromI32(0);
      pool.pendingShares = [BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0)];
    }

    pool.save()
  }


  let sentryWallet = SentryWallet.load(event.params.user.toHexString())
  if (sentryWallet) {
    sentryWallet.esXaiStakeAmount = sentryWallet.esXaiStakeAmount.minus(event.params.amount)
    sentryWallet.save();
  }

  const dataToDecode = getInputFromEvent(event)
  const decoded = ethereum.decode('(address,uint256,uint256)', dataToDecode);

  if (decoded) {
    let index = decoded.toTuple()[1].toBigInt()
    let unstakeRequest = UnstakeRequest.load(event.params.pool.toHexString() + event.params.user.toHexString() + index.toString())
    if (unstakeRequest) {
      unstakeRequest.open = false
      unstakeRequest.completeTime = event.block.timestamp
      unstakeRequest.save();
    } else {
      log.warning("Could not find unstake request!", [])
      log.warning("params: " + event.params.pool.toHexString() + ", " + event.params.user.toHexString() + " " + index.toString(), [])
    }
  }
}

export function handleUpdateMetadata(event: UpdateMetadata): void {
  const pool = PoolInfo.load(event.params.pool.toHexString())

  const dataToDecode = getInputFromEvent(event)
  const decoded = ethereum.decode('(address,string[3],string[])', dataToDecode);

  if (decoded) {
    if (pool) {
      pool.metadata = decoded.toTuple()[1].toStringArray();
      pool.socials = decoded.toTuple()[2].toStringArray();
      pool.save()
    }
  }
}

export function handleUpdatePendingShares(event: UpdateShares): void {
  const pool = PoolInfo.load(event.params.pool.toHexString());

  let poolConfig = PoolFactoryConfig.load("PoolFactoryConfig");

  if (pool) {
    const dataToDecode = getInputFromEvent(event)
    const decoded = ethereum.decode('(address,uint32[3])', dataToDecode);
    if (decoded) {
      pool.pendingShares = decoded.toTuple()[1].toBigIntArray();
      pool.updateSharesTimestamp = event.block.timestamp.plus(poolConfig!.updateRewardBreakdownDelayPeriod);
      pool.save()
    }
  }
}

export function handleUnstakeRequest(event: UnstakeRequestStarted): void {
  const pool = PoolInfo.load(event.params.pool.toHexString())
  if (!pool) {
    log.warning("pool is undefined", []);
    return;
  }

  const poolConfig = PoolFactoryConfig.load("PoolFactoryConfig");

  if (!poolConfig) {
    log.warning("PoolFactoryConfig is undefined", []);
    return;
  }

  const unstakeRequest = new UnstakeRequest(event.params.pool.toHexString() + event.params.user.toHexString() + event.params.index.toString())

  unstakeRequest.user = event.params.user
  unstakeRequest.pool = event.params.pool
  unstakeRequest.index = event.params.index
  unstakeRequest.amount = event.params.amount
  unstakeRequest.isKey = event.params.isKey
  unstakeRequest.open = true
  unstakeRequest.completeTime = BigInt.fromI32(0)
  unstakeRequest.lockTime = event.block.timestamp.plus(poolConfig.unstakeEsXaiDelayPeriod)

  if (event.params.isKey) {
    unstakeRequest.lockTime = event.block.timestamp.plus(poolConfig.unstakeKeysDelayPeriod)

    if (pool.owner == event.params.user) {

      pool.ownerRequestedUnstakeKeyAmount = pool.ownerRequestedUnstakeKeyAmount.plus(event.params.amount)
      //If this event was emitted from unstakeGenesisKeyRequest
      if (getTxSignatureFromEvent(event) == "0xfe407a92") {
        unstakeRequest.lockTime = event.block.timestamp.plus(poolConfig.unstakeGenesisKeyDelayPeriod)
        pool.ownerLatestUnstakeRequestCompletionTime = unstakeRequest.lockTime
      }
      pool.save()
    }

  }

  unstakeRequest.save()
}

export function handleClaimFromPool(event: ClaimFromPool): void {

  const pool = PoolInfo.load(event.params.pool.toHexString())
  if (pool) {

    if (pool.updateSharesTimestamp.ge(event.block.timestamp)) {
      pool.ownerShare = pool.pendingShares[0];
      pool.keyBucketShare = pool.pendingShares[1];
      pool.stakedBucketShare = pool.pendingShares[2];

      pool.updateSharesTimestamp = BigInt.fromI32(0);
      pool.pendingShares = [BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0)];
    }

    pool.save()
  }
}

export function handleUpdateDelayPeriods(event: UpdateDelayPeriods): void {

  let config = PoolFactoryConfig.load("PoolFactoryConfig");
  if (!config) {
    config = new PoolFactoryConfig("PoolFactoryConfig")
  }

  const dataToDecode = getInputFromEvent(event)
  const decoded = ethereum.decode('(uint256,uint256,uint256,uint256)', dataToDecode);

  if (decoded) {
    config.unstakeKeysDelayPeriod = decoded.toTuple()[0].toBigInt();
    config.unstakeGenesisKeyDelayPeriod = decoded.toTuple()[1].toBigInt();
    config.unstakeEsXaiDelayPeriod = decoded.toTuple()[2].toBigInt();
    config.updateRewardBreakdownDelayPeriod = decoded.toTuple()[3].toBigInt();
    config.save();
  }
}