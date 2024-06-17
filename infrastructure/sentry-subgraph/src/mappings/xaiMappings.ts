import { ConvertedToEsXai } from "../../generated/Xai/Xai";
import { ConvertedToEsXaiEvent } from "../../generated/schema";

export function handleConvertedToEsXai(event: ConvertedToEsXai): void {
    const redemption = new ConvertedToEsXaiEvent(
        event.transaction.hash.concatI32(event.logIndex.toI32()),
    );
    redemption.amount = event.params.amount
    redemption.user = event.params.user
    redemption.timestamp = event.block.timestamp

    redemption.save()
}