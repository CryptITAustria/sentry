import { Dispatch, SetStateAction } from "react";
import { AiFillInfoCircle } from "react-icons/ai";
import { PrimaryButton } from "@sentry/ui";
import BaseCallout from "@sentry/ui/src/rebrand/callout/BaseCallout";
import { WarningIcon } from "@sentry/ui/src/rebrand/icons/IconsComponents";
import { PriceDataInterface } from "../hooks/useWebBuyKeysOrderTotal";
import { formatWeiToEther } from "@sentry/core";

interface PromoCodeRowProps {
    discount: { applied: boolean; error: boolean };
    setDiscount: Dispatch<SetStateAction<{ applied: boolean; error: boolean }>>;
    promoCode: string;
    setPromoCode: Dispatch<SetStateAction<string>>;
    handleSubmit: () => Promise<void>;
    promo: boolean;
    currency: string;
    decimalPlaces: number;
    calculateTotalPrice: () => bigint;
    setPromo: Dispatch<SetStateAction<boolean>>;
    displayPricesMayVary: boolean;
    getPriceData: PriceDataInterface | undefined;
}

export function PromoCodeRow({
    discount,
    setDiscount,
    promoCode,
    decimalPlaces,
    setPromoCode,
    handleSubmit,
    promo,
    currency,
    setPromo,
    calculateTotalPrice,
    displayPricesMayVary,
    getPriceData,
}: PromoCodeRowProps) {
    return (
        <div>
            {discount.applied && (
                <>
                    <div className="flex flex-row items-center justify-between text-lg">
                        <div className="flex flex-row items-center gap-2">
                            <span className="text-white">Discount (5%)</span>
                            <a
                                onClick={() => setDiscount({ applied: false, error: false })}
                                className="text-[#F30919] ml-1 cursor-pointer"
                            >
                                Remove
                            </a>
                        </div>
                        <div className="flex flex-row items-center gap-1">
                            <span className="text-white font-semibold">
                                {getPriceData ? formatWeiToEther(calculateTotalPrice() * BigInt(5) / BigInt(100), decimalPlaces) : "0"} {currency}
                            </span>
                        </div>
                    </div>
                    <p className="text-[13px] text-elementalGrey">{promoCode}</p>
                </>
            )}
            {displayPricesMayVary && (
                <div className="w-full flex flex-col bg-bananaBoat px-5 py-4 gap-2 mb-4">
                    <div className="flex items-center gap-2 font-semibold">
                        <AiFillInfoCircle className="w-[20px] h-[20px] text-bananaBoatText" />
                        <p className="text-lg text-bananaBoatText">Your transaction may be reverted</p>
                    </div>
                    <p className="text-sm text-bananaBoatText">
                        Xai Sentry Node Key prices vary depending on the quantity of remaining supply. In general, as the quantity of available keys decreases, the price of a key will increase. If you purchase more Keys than are available in the current pricing tier, the transaction may revert. We recommend splitting the purchase into two transactions - one for the current pricing tier and another in the next pricing tier.
                    </p>
                </div>
            )}
            {!discount.applied && (
                <>
                    {promo ? (
                        <div className="w-full flex flex-col items-center py-2 ">
                            <div className="w-full h-auto flex sm:flex-col lg:flex-row sm:justify-center lg:justify-start items-center text-[15px] text-elementalGrey mt-2 sm:mb-2 lg:mb-0">
                                <div className="w-[300px] h-auto flex flex-row sm:justify-center lg:justify-start items-center text-[15px] text-elementalGrey mt-2 sm:mb-2 lg:mb-0">
                                    <span className="text-[#F30919] text-base">+ Add promo code</span>
                                    <div
                                        className="cursor-pointer z-10"
                                        onClick={() => {
                                            setPromoCode("");
                                            setPromo(false);
                                        }}
                                    >
                                    </div>
                                </div>
                                <div className="flex w-full items-center sm:justify-center">
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => {
                                            setPromoCode(e.target.value);
                                            setDiscount({
                                                applied: false,
                                                error: false,
                                            });
                                        }}
                                        className={`text-white lg:w-full border-r-0 p-2 bg-darkLicorice border ${discount.error ? "border-[#AB0914]" : "border-[#525252]"}`}
                                    />
                                    <div className="lg:hidden sm:block">
                                        <PrimaryButton
                                            onClick={() => handleSubmit()}
                                            btnText="APPLY"
                                            className="text-white text-sm !py-2 max-h-[42.5px] max-w-[90px]"
                                        />
                                    </div>
                                </div>
                                <div className="lg:block sm:hidden">
                                    <PrimaryButton
                                        onClick={() => handleSubmit()}
                                        btnText="APPLY"
                                        className="text-white text-sm !py-2 max-h-[42.5px] max-w-[90px]"
                                    />
                                </div>
                            </div>
                            {discount.error && (
                                <BaseCallout extraClasses={{ calloutWrapper: "h-[50px] w-full mt-2" }} isWarning>
                                    <div className="flex gap-[10px]">
                                        <span className="block"><WarningIcon /></span>
                                        <span className="block">Invalid referral address</span>
                                    </div>
                                </BaseCallout>
                            )}
                        </div>
                    ) : (
                        <p className="flex sm:justify-center lg:justify-start text-[15px] py-2">
                            <a onClick={() => setPromo(true)} className="text-[#F30919] text-base ml-1 cursor-pointer">
                                + Add promo code
                            </a>
                        </p>
                    )}
                </>
            )}
        </div>
    );
}