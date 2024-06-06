import {CustomTooltip} from "@sentry/ui";
import classNames from "classnames";
import {MdRefresh} from "react-icons/md";
import {useQueryClient} from "react-query";
import {useOperator} from "@/features/operator";
import {recommendedFundingBalance} from "@/features/home/SentryWallet";
import {useBalance} from "@/hooks/useBalance";
import { HelpIcon } from "@sentry/ui/src/rebrand/icons/IconsComponents";
import {FaEthereum} from "react-icons/fa";

export function SentryWalletHeader() {
	const queryClient = useQueryClient();
	const {publicKey} = useOperator();
	const {isFetching: isBalanceLoading, data: balance} = useBalance(publicKey);

	function onRefreshEthBalance() {
		void queryClient.invalidateQueries({queryKey: ["balance", publicKey]});
	}

	function getEthFundsTextColor(): string {
		if (balance?.wei !== undefined && balance.wei >= recommendedFundingBalance) {
			return "text-successText";
		}

		return "text-[#F59E28]";
	}

	return (
		<div className="flex flex-col items-start w-full border-b border-primaryBorderColor gap-2 py-[22px] pl-10 bg-primaryBgColor/75">
			<div className="flex items-center gap-1">
				<h2 className="font-medium text-lg text-secondaryText">Sentry Wallet Balance</h2>
				<CustomTooltip
					header={"Funds in AETH required"}
					content={
						<div>
							<p className="text-primaryText block">Sentry Wallet balance is used to pay gas fees for automatically
							claiming accrued esXAI.</p>
							<p className="text-primaryText bg-linkBgHover p-2 mt-2 flex justify-between">
								<span>Recommended minimum balance</span>
								<span className="flex items-center gap-1 font-bold"> <FaEthereum/> 0.005 AETH</span>
							</p>
						</div>
					}
					extraClasses={{tooltipContainer: "!left-[-38px]", tooltipHeader: "!text-primaryText"}}
				>
					<HelpIcon width={14} height={14}/>
				</CustomTooltip>
				{isBalanceLoading ? (
					<p className="flex items-center text-lg font-bold text-tertiaryText select-none ml-[18px]">
						Refreshing
					</p>
				) : (
					<a
						onClick={onRefreshEthBalance}
						className="flex items-center text-lg font-bold text-tertiaryText gap-1 cursor-pointer select-none ml-[14px]"
					>
						<MdRefresh/> Refresh
					</a>
				)}
			</div>

			<div className="flex justify-center items-center gap-4">
				<div className="flex justify-center items-center gap-1">
					<p className={classNames(getEthFundsTextColor(), "text-4xl font-semibold")}>{(balance == undefined) ? "" : (balance.ethString === "0.0" ? "0" : balance.ethString)} AETH</p>
				</div>

			</div>
		</div>
	)
}
