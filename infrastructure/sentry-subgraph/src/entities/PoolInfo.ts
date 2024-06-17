import { Entity, store, Value, ValueKind, BigInt, Bytes } from "@graphprotocol/graph-ts";

export class PoolInfo extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    const id = this.get("id");
    assert(id != null, "Cannot save PoolInfo entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save PoolInfo entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("PoolInfo", id.toString(), this);
    }
  }

  static load(id: string): PoolInfo | null {
    return store.get("PoolInfo", id) as PoolInfo | null;
  }

  get id(): string {
    const value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get address(): Bytes {
    const value = this.get("address");
    return value!.toBytes();
  }

  set address(value: Bytes) {
    this.set("address", Value.fromBytes(value));
  }

  get owner(): Bytes {
    const value = this.get("owner");
    return value!.toBytes();
  }

  set owner(value: Bytes) {
    this.set("owner", Value.fromBytes(value));
  }

  get delegateAddress(): Bytes {
    const value = this.get("delegateAddress");
    return value!.toBytes();
  }

  set delegateAddress(value: Bytes) {
    this.set("delegateAddress", Value.fromBytes(value));
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

  get ownerShare(): BigInt {
    const value = this.get("ownerShare");
    return value!.toBigInt();
  }

  set ownerShare(value: BigInt) {
    this.set("ownerShare", Value.fromBigInt(value));
  }

  get keyBucketShare(): BigInt {
    const value = this.get("keyBucketShare");
    return value!.toBigInt();
  }

  set keyBucketShare(value: BigInt) {
    this.set("keyBucketShare", Value.fromBigInt(value));
  }

  get stakedBucketShare(): BigInt {
    const value = this.get("stakedBucketShare");
    return value!.toBigInt();
  }

  set stakedBucketShare(value: BigInt) {
    this.set("stakedBucketShare", Value.fromBigInt(value));
  }

  get updateSharesTimestamp(): BigInt {
    const value = this.get("updateSharesTimestamp");
    return value!.toBigInt();
  }

  set updateSharesTimestamp(value: BigInt) {
    this.set("updateSharesTimestamp", Value.fromBigInt(value));
  }

  get pendingShares(): Array<BigInt> {
    const value = this.get("pendingShares");
    return value!.toBigIntArray();
  }

  set pendingShares(value: Array<BigInt>) {
    this.set("pendingShares", Value.fromBigIntArray(value));
  }

  get metadata(): Array<string> {
    const value = this.get("metadata");
    return value!.toStringArray();
  }

  set metadata(value: Array<string>) {
    this.set("metadata", Value.fromStringArray(value));
  }

  get socials(): Array<string> {
    const value = this.get("socials");
    return value!.toStringArray();
  }

  set socials(value: Array<string>) {
    this.set("socials", Value.fromStringArray(value));
  }

  get ownerStakedKeys(): BigInt {
    const value = this.get("ownerStakedKeys");
    return value!.toBigInt();
  }

  set ownerStakedKeys(value: BigInt) {
    this.set("ownerStakedKeys", Value.fromBigInt(value));
  }

  get ownerRequestedUnstakeKeyAmount(): BigInt {
    const value = this.get("ownerRequestedUnstakeKeyAmount");
    return value!.toBigInt();
  }

  set ownerRequestedUnstakeKeyAmount(value: BigInt) {
    this.set("ownerRequestedUnstakeKeyAmount", Value.fromBigInt(value));
  }

  get ownerLatestUnstakeRequestCompconstionTime(): BigInt {
    const value = this.get("ownerLatestUnstakeRequestCompconstionTime");
    return value!.toBigInt();
  }

  set ownerLatestUnstakeRequestCompconstionTime(value: BigInt) {
    this.set("ownerLatestUnstakeRequestCompconstionTime", Value.fromBigInt(value));
  }

  get createdTimestamp(): BigInt {
    const value = this.get("createdTimestamp");
    return value!.toBigInt();
  }

  set createdTimestamp(value: BigInt) {
    this.set("createdTimestamp", Value.fromBigInt(value));
  }
}
