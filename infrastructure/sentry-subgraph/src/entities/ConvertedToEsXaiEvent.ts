import { Entity, store, Value, ValueKind, BigInt, Bytes } from "@graphprotocol/graph-ts";

export class ConvertedToEsXaiEvent extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    const id = this.get("id");
    assert(id != null, "Cannot save ConvertedToEsXaiEvent entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save ConvertedToEsXaiEvent entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("ConvertedToEsXaiEvent", id.toString(), this);
    }
  }

  static load(id: string): ConvertedToEsXaiEvent | null {
    return store.get("ConvertedToEsXaiEvent", id) as ConvertedToEsXaiEvent | null;
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

  get amount(): BigInt {
    const value = this.get("amount");
    return value!.toBigInt();
  }

  set amount(value: BigInt) {
    this.set("amount", Value.fromBigInt(value));
  }

  get timestamp(): BigInt {
    const value = this.get("timestamp");
    return value!.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }
}
