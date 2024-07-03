import { InfoPointRed, RedSentryIcon } from "@sentry/ui/src/rebrand/icons/IconsComponents";
import { Tooltip, XaiNumberInput } from "@sentry/ui";
import { useWebBuyKeysContext } from '../contexts/useWebBuyKeysContext';

/**
 * ChooseQuantityRow Component
 * 
 * This component renders the section for choosing the quantity of XAI Sentry Node Keys to purchase.
 * It displays information about the keys and provides an input for selecting the quantity.
 * 
 * @returns {JSX.Element} The rendered ChooseQuantityRow component
 */
export function ChooseQuantityRow(): JSX.Element {
    // Destructure necessary values from the WebBuyKeysContext
    const { quantity, setQuantity, maxSupply } = useWebBuyKeysContext();

    return (
        <div className="flex sm:flex-col lg:flex-row justify-between lg:items-start sm:items-center">
            {/* Information section */}
            <div className="flex flex-col sm:items-center lg:items-start gap-2">
                {/* Title and icon section */}
                <div className="flex flex-row sm:w-full sm:justify-center lg:justify-start items-center gap-1">
                    <RedSentryIcon width={32} height={32} />
                    <p className="sm:text-2xl lg:text-3xl text-white font-bold">
                        XAI SENTRY NODE KEY
                    </p>
                    {/* Tooltip for additional information */}
                    <span className="h-full flex items-center ml-2">
                        <Tooltip
                            header={"Xai keys are required for nodes to receive $esXAI network rewards."}
                            body={"All purchases must be made in Arbitrum ETH."}
                            width={452}
                        >
                            <InfoPointRed />
                        </Tooltip>
                    </span>
                </div>
                {/* Description of Sentry Node Key functionality */}
                <p className="sm:w-full lg:w-[400px] sm:text-center sm:px-8 lg:px-0 lg:text-left text-[18px] text-elementalGrey font-medium">
                    Each Sentry Node Key enables you to submit up to 1 reward claim for each network challenge.
                </p>
            </div>
            {/* Quantity input section */}
            <div className="flex w-full justify-end flex-row items-start gap-4 sm:mt-4 lg:mt-0">
                <div className="flex sm:w-full lg:w-[175px] sm:px-2 lg:px-0">
                    {/* Custom number input component for selecting quantity */}
                    <XaiNumberInput
                        quantity={quantity}
                        setQuantity={setQuantity}
                        maxSupply={maxSupply}
                    />
                </div>
            </div>
        </div>
    );
}