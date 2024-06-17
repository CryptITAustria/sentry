import { Entity, store, Value, ValueKind, Bytes, BigInt } from "@graphprotocol/graph-ts";

export class ConvertedToEsXaiEvent extends Entity {
  constructor(id: Bytes) {
    super();
    this.set("id", Value.fromBytes(id));
  }

  save(): void {
    const id = this.get("id");
    assert(id != null, "Cannot save ConvertedToEsXaiEvent entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.BYTES,
        "Cannot save ConvertedToEsXaiEvent entity with non-bytes ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("ConvertedToEsXaiEvent", id.toBytes().toHex(), this);
    }
  }

  static load(id: Bytes): ConvertedToEsXaiEvent | null {
    return store.get("ConvertedToEsXaiEvent", id.toHex()) as ConvertedToEsXaiEvent | null;
  }

  get id(): Bytes {
    const value = this.get("id");
    return value!.toBytes();
  }

  set id(value: Bytes) {
    this.set("id", Value.fromBytes(value));
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
