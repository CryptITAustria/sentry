import MainTitle from "../titles/MainTitle";
import { Dispatch, SetStateAction, useEffect } from "react";
import { PoolInput } from "../input/InputComponent";
import { PoolTextarea } from "../textareas/TextareasComponent";
import { Tooltip, divider } from "@nextui-org/react";
import { ERROR_MESSAGE, LABELS, PLACEHOLDERS } from "./enums/enums";
import { useFindBlackListWordsHooks } from "@/app/hooks/hooks";
import PopoverWindow from "../staking/PopoverWindow";

const POOL_TOOLTIP_TEXT =
  "This pool name will be displayed in public. Please don't exceed the maximum characters of 24.";

export type PoolDetails = {
  name: string;
  description: string;
  logoUrl: string;
};

export type TrackerInfo = {
  trackerName: string;
  trackerTicker: string;
};

interface PoolDetailsProps {
  poolDetailsValues: PoolDetails;
  tokenTracker: TrackerInfo;
  setPoolDetailsValues: Dispatch<SetStateAction<PoolDetails>>;
  setError: Dispatch<SetStateAction<boolean>>;
  setTokenTracker: Dispatch<SetStateAction<TrackerInfo>>;
  hideTokenTrackers?: boolean;
}

const PoolDetailsComponent = ({
  poolDetailsValues,
  tokenTracker,
  setPoolDetailsValues,
  setError,
  setTokenTracker,
  hideTokenTrackers,
}: PoolDetailsProps) => {
  const { name, description, logoUrl } = poolDetailsValues;
  const { trackerName, trackerTicker } = tokenTracker;
  const { badInputName, badInputDescription } =
    useFindBlackListWordsHooks(poolDetailsValues);
  const inputNameRequirements = name.length < 5 || name.length > 24;
  const inputDescriptionRequirements =
    description.length < 10 || description.length > 400;
  const inputTrackerNameRequirements = tokenTracker.trackerName.length > 24;
  const inputTickerRequirements = tokenTracker.trackerTicker.length > 6;

  useEffect(() => {
    inputNameRequirements ||
    inputDescriptionRequirements ||
    inputTrackerNameRequirements ||
    inputTickerRequirements ||
    badInputName || badInputDescription
      ? setError(true)
      : setError(false);
  }, [badInputDescription, badInputName, inputDescriptionRequirements, inputNameRequirements, inputTickerRequirements, inputTrackerNameRequirements, setError]);

  const handleChangeDetails = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPoolDetailsValues({
      ...poolDetailsValues,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangeTracker = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenTracker({
      ...tokenTracker,
      [e.target.name]: e.target.value,
    });
  };

  const showErrorMessageName = () => {
    if (name.length > 24) {
      return ERROR_MESSAGE.NAME_LENGTH;
    }
    if (name.length < 5) {
      return ERROR_MESSAGE.ENTER_TEXT;
    }
    if (badInputName) {
      return ERROR_MESSAGE.BAD_WORD_MESSAGE;
    }
  };

  return (
    <>
      <MainTitle title="Pool details" classNames="text-xl font-bold !mb-8" />
      <div className="mb-[40px] w-full">
        <Tooltip
          content={<span className="p-2 text-base">{POOL_TOOLTIP_TEXT}</span>}
        >
          <div className="mb-[20px] w-full">
            <PoolInput
              name="name"
              label={LABELS.NAME}
              placeholder={PLACEHOLDERS.NAME}
              isInvalid={inputNameRequirements || badInputName}
              errorMessage={showErrorMessageName()}
              type="text"
              onChange={handleChangeDetails}
              value={name}
            />
          </div>
        </Tooltip>
        <div className="w-full mb-[80px]">
          <PoolTextarea
            name="description"
            label={LABELS.DESCRIPTION}
            placeholder={PLACEHOLDERS.DESCRIPTION}
            errorMessage={
              badInputDescription
                ? ERROR_MESSAGE.BAD_WORD_MESSAGE
                : ERROR_MESSAGE.DESCRIPTION
            }
            isInvalid={inputDescriptionRequirements || badInputDescription}
            onChange={handleChangeDetails}
            value={description}
          />
        </div>
        <div className="w-full mb-[50px]">
          <PoolInput
            name="logoUrl"
            value={logoUrl}
            onChange={handleChangeDetails}
            label="Pool logo"
            placeholder="Enter image URL here"
          />
        </div>
        {!hideTokenTrackers && (
          <div className="w-full flex sm:flex-col lg:flex-row">
            <div className="lg:w-[70%] sm:w-full lg:mr-4 sm:mb-[40px] lg:mb-0">
              <PoolInput
                name="trackerName"
                value={trackerName}
                onChange={handleChangeTracker}
                label="Token tracker name"
                placeholder="Enter name here"
                isInvalid={inputTrackerNameRequirements}
                errorMessage={ERROR_MESSAGE.TRACKER_NAME}
                endContent={
                  <div className="absolute bottom-[58px] left-[145px]">
                    <PopoverWindow tokenText />
                  </div>
                }
              />
            </div>
            <div className="lg:w-[30%] sm:w-full">
              <PoolInput
                name="trackerTicker"
                value={trackerTicker}
                onChange={handleChangeTracker}
                label="Token tracker ticker"
                placeholder="Enter ticker here"
                isInvalid={inputTickerRequirements}
                errorMessage={ERROR_MESSAGE.TICKER}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PoolDetailsComponent;