import { PoolInfo, TierInfo } from "@/types/Pool";
import {
  TableHead,
  TableRowCapacity,
  TableRowLabel,
  TableRowPool,
  TableRowRewards,
  TableRowStaked,
} from "./TableChunksComponents";
import { getCurrentTierByStaking } from "./utils";
import { iconType } from "@/app/components/dashboard/constants/constants";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import { BasePagination } from "@/app/components/ui";
import { formatDailyRewardRate, formatDailyRewardRatePercentage } from "@/app/utils/formatDailyRewardRate";
import { formatCurrencyCompact } from "@/app/utils/formatCurrency";

const POOL_DATA_COLUMS = [
  "POOL NAME",
  "POOL TIER",
  "",
  // "POOL UPTIME",
  "OWNER SPLIT",
  "KEY SPLIT",
  "esXAI SPLIT",
  "esXAI RATE",
  "ACTIONS",
];

const POOL_DATA_COLUMS_MOBILE = [
  "",
  "POOL TIER",
  "",
  // "POOL UPTIME",
  // "OWNER SPLIT",
  // "esXAI SPLIT",
  // "POOL UPTIME",
  "REWARDS BREAKDOWN",
  "",
];

interface AvailableTableProps {
  showTableKeys: boolean;
  pools: PoolInfo[];
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  address: string | undefined;
  tiers?: Array<TierInfo & { icon?: iconType }>;
  maxKeyPerPool: number;
}

const AvailablePoolsTableComponent = ({
  showTableKeys,
  pools,
  page,
  totalPages,
  setPage,
  address,
  tiers,
  maxKeyPerPool,
}: AvailableTableProps) => {
  const { open } = useWeb3Modal();
  const { isDisconnected } = useAccount();

  return (
    <>
      <table className="min-w-full text-base font-light bg-nulnOilBackground shadow-default">
        <thead className="sm:hidden lg:table-header-group bg-dynamicBlack">
          <tr>
            {POOL_DATA_COLUMS.map((column, index) => {
              return (
                <TableHead
                  key={index}
                  column={column}
                  index={index}
                  showTableKeys={showTableKeys}
                />
              );
            })}
          </tr>
        </thead>
        <thead className="lg:hidden bg-dynamicBlack">
          <tr>
            {POOL_DATA_COLUMS_MOBILE.map((column, index) => {
              return (
                <TableHead
                  key={index}
                  column={column}
                  index={index}
                  showTableKeys={showTableKeys}
                />
              );
            })}
          </tr>
        </thead>
        {pools.length > 0 && (
          <tbody>
            {pools.map((pool, index) => {
              return (
                <tr key={index} className={`border-b border-dynamicBlack text-right group`}>
                  <TableRowPool pool={pool}
                                tier={getCurrentTierByStaking(Math.min(pool.totalStakedAmount, pool.maxStakedAmount), tiers) as TierInfo & {
                                  icon: iconType
                                }} customClass="group-hover:bg-dynamicBlack group-hover:bg-opacity-50 duration-100 ease-in" />
                  <TableRowLabel
                    tier={getCurrentTierByStaking(Math.min(pool.totalStakedAmount, pool.maxStakedAmount), tiers) as TierInfo & {
                      icon: iconType
                    }} poolAddress={pool.address} customClass="group-hover:bg-dynamicBlack group-hover:bg-opacity-50 duration-100 ease-in" />
                  <TableRowCapacity pool={pool} showTableKeys={showTableKeys} maxKeyPerPool={maxKeyPerPool} customClass="group-hover:bg-dynamicBlack group-hover:bg-opacity-50 duration-100 ease-in sm:min-w-[85px]" progressClass="lg:max-w-[65%]" />
                  {/* <TableRowStaked value={"__%"} positionStyles="sm:items-end"/> POOL UPTIME */}
                  <TableRowStaked value={`${pool.ownerShare}%`}  poolAddress={pool.address} customClass="sm:hidden lg:table-cell group-hover:bg-dynamicBlack group-hover:bg-opacity-50 duration-100 ease-in" positionStyles="!items-end"/>
                  <TableRowStaked value={`${pool.keyBucketShare}%`} poolAddress={pool.address} customClass="sm:hidden lg:table-cell group-hover:bg-dynamicBlack group-hover:bg-opacity-50 duration-100 ease-in"  positionStyles="!items-end"/>
                  <TableRowStaked value={`${pool.stakedBucketShare}%`} poolAddress={pool.address} customClass="sm:hidden lg:table-cell group-hover:bg-dynamicBlack group-hover:bg-opacity-50 duration-100 ease-in" positionStyles="!items-end"/>
                  {showTableKeys ? (
                    <TableRowStaked value={`${pool.keyCount == 0 ? 0 : formatDailyRewardRate(pool.keyRewardRate, 2)} esXAI`} poolAddress={pool.address} customClass="sm:hidden lg:table-cell group-hover:bg-dynamicBlack group-hover:bg-opacity-50 duration-100 ease-in" positionStyles="!items-end"/>
                  ) : (
                    <TableRowStaked value={`${pool.keyCount == 0 ? 0 : formatDailyRewardRatePercentage(pool.esXaiRewardRate, 2)}%`} poolAddress={pool.address} customClass="sm:hidden lg:table-cell group-hover:bg-dynamicBlack group-hover:bg-opacity-50 duration-100 ease-in" positionStyles="!items-end"/>
                  )}
                  <TableRowRewards pool={pool} showTableKeys={showTableKeys} isDisconnected={isDisconnected} onClick={open} customClass="group-hover:bg-dynamicBlack group-hover:bg-opacity-50 duration-100 ease-in" />
                  {showTableKeys ? (
                    <TableRowStaked value={`${pool.keyCount == 0 ? 0 : formatCurrencyCompact.format(formatDailyRewardRate(pool.keyRewardRate, 2))} esXAI`} poolAddress={pool.address} customClass="sm:table-cell lg:hidden group-hover:bg-dynamicBlack group-hover:bg-opacity-50 duration-100 ease-in sm:!pr-[14px]" positionStyles="!items-end" rateClass="!text-right"/>
                  ) : (
                    <TableRowStaked value={`${pool.keyCount == 0 ? 0 : formatCurrencyCompact.format(formatDailyRewardRatePercentage(pool.esXaiRewardRate, 2))}%`} poolAddress={pool.address} customClass="sm:table-cell lg:hidden group-hover:bg-dynamicBlack group-hover:bg-opacity-50 duration-100 ease-in sm:!pr-[14px]" positionStyles="!items-end"/>
                  )}
                </tr>
              );
            })}
          </tbody>
        )}
      </table>
      {pools.length === 0 && address && <NoResultComponent />}
      <div className="flex sm:justify-center p-3 lg:justify-end w-full sm:pb-4 bg-nulnOilBackground shadow-default">
        <BasePagination
          currentPage={page}
          setPage={setPage}
          totalPages={totalPages}
        />
      </div>
    </>
  );
};

function NoResultComponent() {
  return (
    <div className="w-full flex flex-col items-center text-[18px] justify-center bg-nulnOilBackground py-[30px] border-b border-dynamicBlack">
      <span className="text-americanSilver">
        No search results found
      </span>
      {/* <button className="text-hornetSting mt-2 font-bold w-[100px]">Reset search</button> */}
    </div>
  );
}

export default AvailablePoolsTableComponent;
