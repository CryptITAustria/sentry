import { Entity, store, Value, ValueKind, BigInt, Bytes } from "@graphprotocol/graph-ts";

export class SentryKey extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    const id = this.get("id");
    assert(id != null, "Cannot save SentryKey entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save SentryKey entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("SentryKey", id.toString(), this);
    }
  }

  static load(id: string): SentryKey | null {
    return store.get("SentryKey", id) as SentryKey | null;
  }

  get id(): string {
    const value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get owner(): Bytes {
    const value = this.get("owner");
    return value!.toBytes();
  }

  set owner(value: Bytes) {
    this.set("owner", Value.fromBytes(value));
  }

  get sentryWallet(): string {
    const value = this.get("sentryWallet");
    return value!.toString();
  }

  set sentryWallet(value: string) {
    this.set("sentryWallet", Value.fromString(value));
  }

  get keyId(): BigInt {
    const value = this.get("keyId");
    return value!.toBigInt();
  }

  set keyId(value: BigInt) {
    this.set("keyId", Value.fromBigInt(value));
  }

  get mintTimeStamp(): BigInt {
    const value = this.get("mintTimeStamp");
    return value!.toBigInt();
  }

  set mintTimeStamp(value: BigInt) {
    this.set("mintTimeStamp", Value.fromBigInt(value));
  }

  get assignedPool(): Bytes {
    const value = this.get("assignedPool");
    return value!.toBytes();
  }

  set assignedPool(value: Bytes) {
    this.set("assignedPool", Value.fromBytes(value));
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
