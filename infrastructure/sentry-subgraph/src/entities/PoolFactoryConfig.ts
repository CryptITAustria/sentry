import { Entity, store, Value, ValueKind, BigInt } from "@graphprotocol/graph-ts";

export class PoolFactoryConfig extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    const id = this.get("id");
    assert(id != null, "Cannot save PoolFactoryConfig entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save PoolFactoryConfig entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("PoolFactoryConfig", id.toString(), this);
    }
  }

  static load(id: string): PoolFactoryConfig | null {
    return store.get("PoolFactoryConfig", id) as PoolFactoryConfig | null;
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

  get unstakeKeysDelayPeriod(): BigInt {
    const value = this.get("unstakeKeysDelayPeriod");
    return value!.toBigInt();
  }

  set unstakeKeysDelayPeriod(value: BigInt) {
    this.set("unstakeKeysDelayPeriod", Value.fromBigInt(value));
  }

  get unstakeGenesisKeyDelayPeriod(): BigInt {
    const value = this.get("unstakeGenesisKeyDelayPeriod");
    return value!.toBigInt();
  }

  set unstakeGenesisKeyDelayPeriod(value: BigInt) {
    this.set("unstakeGenesisKeyDelayPeriod", Value.fromBigInt(value));
  }

  get unstakeEsXaiDelayPeriod(): BigInt {
    const value = this.get("unstakeEsXaiDelayPeriod");
    return value!.toBigInt();
  }

  set unstakeEsXaiDelayPeriod(value: BigInt) {
    this.set("unstakeEsXaiDelayPeriod", Value.fromBigInt(value));
  }

  get updateRewardBreakdownDelayPeriod(): BigInt {
    const value = this.get("updateRewardBreakdownDelayPeriod");
    return value!.toBigInt();
  }

  set updateRewardBreakdownDelayPeriod(value: BigInt) {
    this.set("updateRewardBreakdownDelayPeriod", Value.fromBigInt(value));
  }
}
