import { Entity, store, Value, ValueKind, BigInt, Bytes } from "@graphprotocol/graph-ts";

export class UnstakeRequest extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    const id = this.get("id");
    assert(id != null, "Cannot save UnstakeRequest entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save UnstakeRequest entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("UnstakeRequest", id.toString(), this);
    }
  }

  static load(id: string): UnstakeRequest | null {
    return store.get("UnstakeRequest", id) as UnstakeRequest | null;
  }

  get id(): string {
    const value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get user(): Bytes {
    const value = this.get("user");
    return value!.toBytes();
  }

  set user(value: Bytes) {
    this.set("user", Value.fromBytes(value));
  }

  get pool(): Bytes {
    const value = this.get("pool");
    return value!.toBytes();
  }

  set pool(value: Bytes) {
    this.set("pool", Value.fromBytes(value));
  }

  get index(): BigInt {
    const value = this.get("index");
    return value!.toBigInt();
  }

  set index(value: BigInt) {
    this.set("index", Value.fromBigInt(value));
  }

  get amount(): BigInt {
    const value = this.get("amount");
    return value!.toBigInt();
  }

  set amount(value: BigInt) {
    this.set("amount", Value.fromBigInt(value));
  }

  get isKey(): boolean {
    const value = this.get("isKey");
    return value!.toBoolean();
  }

  set isKey(value: boolean) {
    this.set("isKey", Value.fromBoolean(value));
  }

  get open(): boolean {
    const value = this.get("open");
    return value!.toBoolean();
  }

  set open(value: boolean) {
    this.set("open", Value.fromBoolean(value));
  }

  get lockTime(): BigInt {
    const value = this.get("lockTime");
    return value!.toBigInt();
  }

  set lockTime(value: BigInt) {
    this.set("lockTime", Value.fromBigInt(value));
  }

  get completeTime(): BigInt {
    const value = this.get("completeTime");
    return value!.toBigInt();
  }

  set completeTime(value: BigInt) {
    this.set("completeTime", Value.fromBigInt(value));
  }
}
