import { Entity, store, Value, ValueKind, BigInt, Bytes } from "@graphprotocol/graph-ts";

export class PoolChallenge extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    const id = this.get("id");
    assert(id != null, "Cannot save PoolChallenge entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save PoolChallenge entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("PoolChallenge", id.toString(), this);
    }
  }

  static load(id: string): PoolChallenge | null {
    return store.get("PoolChallenge", id) as PoolChallenge | null;
  }

  get id(): string {
    const value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get challenge(): string {
    const value = this.get("challenge");
    return value!.toString();
  }

  set challenge(value: string) {
    this.set("challenge", Value.fromString(value));
  }

  get pool(): string {
    const value = this.get("pool");
    return value!.toString();
  }

  set pool(value: string) {
    this.set("pool", Value.fromString(value));
  }

  get totalClaimedEsXaiAmount(): BigInt {
    const value = this.get("totalClaimedEsXaiAmount");
    return value!.toBigInt();
  }

  set totalClaimedEsXaiAmount(value: BigInt) {
    this.set("totalClaimedEsXaiAmount", Value.fromBigInt(value));
  }

  get totalStakedEsXaiAmount(): BigInt {
    const value = this.get("totalStakedEsXaiAmount");
    return value!.toBigInt();
  }

  set totalStakedEsXaiAmount(value: BigInt) {
    this.set("totalStakedEsXaiAmount", Value.fromBigInt(value));
  }

  get totalStakedKeyAmount(): BigInt {
    const value = this.get("totalStakedKeyAmount");
    return value!.toBigInt();
  }

  set totalStakedKeyAmount(value: BigInt) {
    this.set("totalStakedKeyAmount", Value.fromBigInt(value));
  }
}
