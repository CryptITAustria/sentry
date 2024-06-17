import { Entity, store, Value, ValueKind, BigInt, Bytes } from "@graphprotocol/graph-ts";

export class SentryWallet extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    const id = this.get("id");
    assert(id != null, "Cannot save SentryWallet entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save SentryWallet entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("SentryWallet", id.toString(), this);
    }
  }

  static load(id: string): SentryWallet | null {
    return store.get("SentryWallet", id) as SentryWallet | null;
  }

  get id(): string {
    const value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get isKYCApproved(): boolean {
    const value = this.get("isKYCApproved");
    return value!.toBoolean();
  }

  set isKYCApproved(value: boolean) {
    this.set("isKYCApproved", Value.fromBoolean(value));
  }

  get address(): Bytes {
    const value = this.get("address");
    return value!.toBytes();
  }

  set address(value: Bytes) {
    this.set("address", Value.fromBytes(value));
  }

  get approvedOperators(): Array<Bytes> {
    const value = this.get("approvedOperators");
    return value!.toBytesArray();
  }

  set approvedOperators(value: Array<Bytes>) {
    this.set("approvedOperators", Value.fromBytesArray(value));
  }

  get v1EsXaiStakeAmount(): BigInt {
    const value = this.get("v1EsXaiStakeAmount");
    return value!.toBigInt();
  }

  set v1EsXaiStakeAmount(value: BigInt) {
    this.set("v1EsXaiStakeAmount", Value.fromBigInt(value));
  }

  get esXaiStakeAmount(): BigInt {
    const value = this.get("esXaiStakeAmount");
    return value!.toBigInt();
  }

  set esXaiStakeAmount(value: BigInt) {
    this.set("esXaiStakeAmount", Value.fromBigInt(value));
  }

  get keyCount(): BigInt {
    const value = this.get("keyCount");
    return value!.toBigInt();
  }

  set keyCount(value: BigInt) {
    this.set("keyCount", Value.fromBigInt(value));
  }

  get stakedKeyCount(): BigInt {
    const value = this.get("stakedKeyCount");
    return value!.toBigInt();
  }

  set stakedKeyCount(value: BigInt) {
    this.set("stakedKeyCount", Value.fromBigInt(value));
  }

  get sentryKeys(): Array<string> | null {
    const value = this.get("sentryKeys");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set sentryKeys(value: Array<string> | null) {
    if (!value) {
      this.unset("sentryKeys");
    } else {
      this.set("sentryKeys", Value.fromStringArray(<Array<string>>value));
    }
  }

  get submissions(): Array<string> | null {
    const value = this.get("submissions");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set submissions(value: Array<string> | null) {
    if (!value) {
      this.unset("submissions");
    } else {
      this.set("submissions", Value.fromStringArray(<Array<string>>value));
    }
  }
}
