import { Entity, store, Value, ValueKind, BigInt, Bytes } from "@graphprotocol/graph-ts";

export class Submission extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    const id = this.get("id");
    assert(id != null, "Cannot save Submission entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Submission entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Submission", id.toString(), this);
    }
  }

  static load(id: string): Submission | null {
    return store.get("Submission", id) as Submission | null;
  }

  get id(): string {
    const value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get challengeNumber(): BigInt {
    const value = this.get("challengeNumber");
    return value!.toBigInt();
  }

  set challengeNumber(value: BigInt) {
    this.set("challengeNumber", Value.fromBigInt(value));
  }

  get claimed(): boolean {
    const value = this.get("claimed");
    return value!.toBoolean();
  }

  set claimed(value: boolean) {
    this.set("claimed", Value.fromBoolean(value));
  }

  get eligibleForPayout(): boolean {
    const value = this.get("eligibleForPayout");
    return value!.toBoolean();
  }

  set eligibleForPayout(value: boolean) {
    this.set("eligibleForPayout", Value.fromBoolean(value));
  }

  get nodeLicenseId(): BigInt {
    const value = this.get("nodeLicenseId");
    return value!.toBigInt();
  }

  set nodeLicenseId(value: BigInt) {
    this.set("nodeLicenseId", Value.fromBigInt(value));
  }

  get assertionsStateRootOrConfirmData(): string {
    const value = this.get("assertionsStateRootOrConfirmData");
    return value!.toString();
  }

  set assertionsStateRootOrConfirmData(value: string) {
    this.set("assertionsStateRootOrConfirmData", Value.fromString(value));
  }

  get claimAmount(): BigInt {
    const value = this.get("claimAmount");
    return value!.toBigInt();
  }

  set claimAmount(value: BigInt) {
    this.set("claimAmount", Value.fromBigInt(value));
  }

  get createdTimestamp(): BigInt {
    const value = this.get("createdTimestamp");
    return value!.toBigInt();
  }

  set createdTimestamp(value: BigInt) {
    this.set("createdTimestamp", Value.fromBigInt(value));
  }

  get claimTimestamp(): BigInt {
    const value = this.get("claimTimestamp");
    return value!.toBigInt();
  }

  set claimTimestamp(value: BigInt) {
    this.set("claimTimestamp", Value.fromBigInt(value));
  }

  get createdTxHash(): Bytes {
    const value = this.get("createdTxHash");
    return value!.toBytes();
  }

  set createdTxHash(value: Bytes) {
    this.set("createdTxHash", Value.fromBytes(value));
  }

  get claimTxHash(): Bytes {
    const value = this.get("claimTxHash");
    return value!.toBytes();
  }

  set claimTxHash(value: Bytes) {
    this.set("claimTxHash", Value.fromBytes(value));
  }

  get sentryKey(): string {
    const value = this.get("sentryKey");
    return value!.toString();
  }

  set sentryKey(value: string) {
    this.set("sentryKey", Value.fromString(value));
  }

  get challenge(): string {
    const value = this.get("challenge");
    return value!.toString();
  }

  set challenge(value: string) {
    this.set("challenge", Value.fromString(value));
  }

  get submittedFrom(): string {
    const value = this.get("submittedFrom");
    return value!.toString();
  }

  set submittedFrom(value: string) {
    this.set("submittedFrom", Value.fromString(value));
  }

  get claimedFrom(): string {
    const value = this.get("claimedFrom");
    return value!.toString();
  }

  set claimedFrom(value: string) {
    this.set("claimedFrom", Value.fromString(value));
  }
}
