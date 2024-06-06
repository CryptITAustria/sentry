import {GreenPulse, GreyPulse, YellowPulse} from "@/features/keys/StatusPulse";
import {useOperatorRuntime} from "@/hooks/useOperatorRuntime";
import {AiFillWarning} from "react-icons/ai";
import {Card} from "@/features/home/cards/Card";
import {FaCircleCheck} from "react-icons/fa6";
import {useOperator} from "@/features/operator";
import {useBalance} from "@/hooks/useBalance";
import {recommendedFundingBalance} from "@/features/home/SentryWallet";
import {getLatestChallenge} from "@sentry/core";
import {ReactNode, useEffect, useState} from "react";
import log from "electron-log";
import { PrimaryButton } from "@sentry/ui";
import { HelpIcon } from "@sentry/ui/src/rebrand/icons/IconsComponents";
import img from '@/assets/images/dashboard-card.png';

export function SentryNodeStatusCard() {
	const {publicKey} = useOperator();
	const {data: balance} = useBalance(publicKey);
	const {startRuntime, sentryRunning} = useOperatorRuntime();
	const nodeStatus = balance?.wei !== undefined && balance.wei >= recommendedFundingBalance;
	const [timeAgoString, setTimeAgoString] = useState<ReactNode | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const challengeData = await getLatestChallenge();
				const createdTimestamp = challengeData?.[1]?.createdTimestamp;
				setTimeAgoString(createdTimestamp
					? formatTimeAgo(Number(createdTimestamp) * 1000)
					: <div>Error retrieving challenge data</div>
				);
			} catch (error) {
				log.error('Error fetching latest challenge:', error);
				setTimeAgoString(<div>Error fetching latest challenge</div>);
			}
		};

		void fetchData(); // Initial fetch

		const intervalId = setInterval(() => {
			void fetchData();
		}, 60000);

		return () => clearInterval(intervalId);
	}, []);


	function formatTimeAgo(createdTimestamp: number): string {
		const formatDate = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }).format(createdTimestamp);
		
		return `Last challenge ${formatDate}`;
	}


	function getNodeFunds() {
		return (
			<div
				className={`absolute bottom-4 left-4 max-w-[338px] h-[54px] flex justify-center items-center gap-1 rounded-lg ${nodeStatus ? "text-lg text-[#3DD68C] bg-successBgColor" : "text-lg text-primaryTooltipColor bg-[#FFC53D1A]"} p-4 global-cta-clip-path`}>
				<div className="flex justify-center items-center gap-2">
					<div className="flex justify-center items-center gap-3">
						{nodeStatus
							? (
								<><FaCircleCheck color={"#3DD68C"} size={23}/>Your node is sufficiently funded <HelpIcon width={14} height={14} fill='#3DD68C'/></>
							) : (
								<><AiFillWarning color={"#FFC53D"} size={23}/>Your node is insufficiently funded <HelpIcon width={14} height={14} fill='#FFC53D'/></>
							)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<Card width={"695px"} height={"367px"} customClasses="bg-primaryBgColor">
			{sentryRunning && (
				<div className="absolute left-0 right-0 w-[695px] h-[367px] scale-[1.4] translate-x-[-90px] translate-y-[-15px]">
					<img src={img} alt="logo" />
				</div>
			)}

			<div className="sticky flex flex-row justify-between items-center py-5 px-6 border-b border-primaryBorderColor bg-primaryBgColor z-10">
				<div className="flex flex-row items-center gap-1 text-white text-2xl">
					<h2 className="font-bold">Sentry Node Status</h2>
					<p className="flex items-center ml-2 text-lg text-secondaryText">
						{timeAgoString}
					</p>
				</div>
			</div>

			<div className="p-6">
				{sentryRunning ? (
					<>
						<div className="relative text-[54px] text-white flex items-center gap-5 font-bold">
							{nodeStatus ? (<GreenPulse size={"lg"}/>) : (<YellowPulse size={"lg"}/>)} Your node is
							running
						</div>
						{getNodeFunds()}
					</>
				) : (
					<>
						<div className="relative text-[54px] text-white flex items-center gap-5 font-semibold">
							<GreyPulse size={"lg"}/> Your node is not running
						</div>

						<div
							className="absolute left-0 right-0 bottom-7 w-full h-[40px] flex justify-center items-center gap-1 px-6 pt-4 pb-7">
							<PrimaryButton
								className={`w-[643px] bg-btnPrimaryBgColor text-[20px] uppercase font-semibold mt-2 global-cta-clip-path hover:text-btnPrimaryBgColor`}
								onClick={() => startRuntime}
								btnText="Start Node"
								colorStyle="primary"
								size="md"
							/>
						</div>
					</>
				)}
			</div>
		</Card>
	)
}
