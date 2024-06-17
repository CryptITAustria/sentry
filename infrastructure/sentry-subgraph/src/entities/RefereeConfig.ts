import { Entity, store, Value, ValueKind, BigInt } from "@graphprotocol/graph-ts";

export class RefereeConfig extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    const id = this.get("id");
    assert(id != null, "Cannot save RefereeConfig entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save RefereeConfig entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("RefereeConfig", id.toString(), this);
    }
  }

  static load(id: string): RefereeConfig | null {
    return store.get("RefereeConfig", id) as RefereeConfig | null;
  }

  get id(): string {
    const value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get version(): BigInt {
    const value = this.get("version");
    return value!.toBigInt();
  }

  set version(value: BigInt) {
    this.set("version", Value.fromBigInt(value));
  }

  get maxStakeAmountPerLicense(): BigInt {
    const value = this.get("maxStakeAmountPerLicense");
    return value!.toBigInt();
  }

  set maxStakeAmountPerLicense(value: BigInt) {
    this.set("maxStakeAmountPerLicense", Value.fromBigInt(value));
  }

  get maxKeysPerPool(): BigInt {
    const value = this.get("maxKeysPerPool");
    return value!.toBigInt();
  }

  set maxKeysPerPool(value: BigInt) {
    this.set("maxKeysPerPool", Value.fromBigInt(value));
  }

  get stakeAmountTierThresholds(): Array<BigInt> {
    const value = this.get("stakeAmountTierThresholds");
    return value!.toBigIntArray();
  }

  set stakeAmountTierThresholds(value: Array<BigInt>) {
    this.set("stakeAmountTierThresholds", Value.fromBigIntArray(value));
  }

  get stakeAmountBoostFactors(): Array<BigInt> {
    const value = this.get("stakeAmountBoostFactors");
    return value!.toBigIntArray();
  }

  set stakeAmountBoostFactors(value: Array<BigInt>) {
    this.set("stakeAmountBoostFactors", Value.fromBigIntArray(value));
  }
}
