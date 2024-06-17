import { Entity, store, Value, ValueKind, BigInt, Bytes } from "@graphprotocol/graph-ts";

export class Challenge extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    const id = this.get("id");
    assert(id != null, "Cannot save Challenge entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Challenge entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Challenge", id.toString(), this);
    }
  }

  static load(id: string): Challenge | null {
    return store.get("Challenge", id) as Challenge | null;
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

  get status(): string {
    const value = this.get("status");
    return value!.toString();
  }

  set status(value: string) {
    this.set("status", Value.fromString(value));
  }

  get assertionId(): BigInt {
    const value = this.get("assertionId");
    return value!.toBigInt();
  }

  set assertionId(value: BigInt) {
    this.set("assertionId", Value.fromBigInt(value));
  }

  get assertionStateRootOrConfirmData(): Bytes {
    const value = this.get("assertionStateRootOrConfirmData");
    return value!.toBytes();
  }

  set assertionStateRootOrConfirmData(value: Bytes) {
    this.set("assertionStateRootOrConfirmData", Value.fromBytes(value));
  }

  get assertionTimestamp(): BigInt {
    const value = this.get("assertionTimestamp");
    return value!.toBigInt();
  }

  set assertionTimestamp(value: BigInt) {
    this.set("assertionTimestamp", Value.fromBigInt(value));
  }

  get challengerSignedHash(): Bytes {
    const value = this.get("challengerSignedHash");
    return value!.toBytes();
  }

  set challengerSignedHash(value: Bytes) {
    this.set("challengerSignedHash", Value.fromBytes(value));
  }

  get activeChallengerPublicKey(): Bytes {
    const value = this.get("activeChallengerPublicKey");
    return value!.toBytes();
  }

  set activeChallengerPublicKey(value: Bytes) {
    this.set("activeChallengerPublicKey", Value.fromBytes(value));
  }

  get rollupUsed(): Bytes {
    const value = this.get("rollupUsed");
    return value!.toBytes();
  }

  set rollupUsed(value: Bytes) {
    this.set("rollupUsed", Value.fromBytes(value));
  }

  get createdTimestamp(): BigInt {
    const value = this.get("createdTimestamp");
    return value!.toBigInt();
  }

  set createdTimestamp(value: BigInt) {
    this.set("createdTimestamp", Value.fromBigInt(value));
  }

  get totalSupplyOfNodesAtChallengeStart(): BigInt {
    const value = this.get("totalSupplyOfNodesAtChallengeStart");
    return value!.toBigInt();
  }

  set totalSupplyOfNodesAtChallengeStart(value: BigInt) {
    this.set("totalSupplyOfNodesAtChallengeStart", Value.fromBigInt(value));
  }

  get rewardAmountForClaimers(): BigInt {
    const value = this.get("rewardAmountForClaimers");
    return value!.toBigInt();
  }

  set rewardAmountForClaimers(value: BigInt) {
    this.set("rewardAmountForClaimers", Value.fromBigInt(value));
  }

  get amountForGasSubsidy(): BigInt {
    const value = this.get("amountForGasSubsidy");
    return value!.toBigInt();
  }

  set amountForGasSubsidy(value: BigInt) {
    this.set("amountForGasSubsidy", Value.fromBigInt(value));
  }

  get numberOfEligibleClaimers(): BigInt {
    const value = this.get("numberOfEligibleClaimers");
    return value!.toBigInt();
  }

  set numberOfEligibleClaimers(value: BigInt) {
    this.set("numberOfEligibleClaimers", Value.fromBigInt(value));
  }

  get amountClaimedByClaimers(): BigInt {
    const value = this.get("amountClaimedByClaimers");
    return value!.toBigInt();
  }

  set amountClaimedByClaimers(value: BigInt) {
    this.set("amountClaimedByClaimers", Value.fromBigInt(value));
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

  get poolChallenges(): Array<string> | null {
    const value = this.get("poolChallenges");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set poolChallenges(value: Array<string> | null) {
    if (!value) {
      this.unset("poolChallenges");
    } else {
      this.set("poolChallenges", Value.fromStringArray(<Array<string>>value));
    }
  }
}
