import React, { ReactNode, useEffect, useState } from "react";
import { TextButton } from "@/app/components/ui/buttons";
import { CloseIcon } from "@/app/components/icons/IconsComponent";
import { DropdownItem, DropdownText } from "../../dropdown/DropdownText";
import { PrimaryButton } from "../../../../../../../packages/ui/src/rebrand/buttons/PrimaryButton";
import { listOfCountries } from "../../../../../../sentry-client-desktop/src/components/blockpass/CountryDropdown";
import { useBlockIp } from "@/app/hooks";
import ExternalLinkIcon from "../../../../../../../packages/ui/src/rebrand/icons/ExternalLinkIcon";

interface BaseModalProps {
  isOpened: boolean;
  modalBody: string | ReactNode;
  closeModal: () => void;
  onSubmit?: () => void;
  modalHeader?: string;
  cancelText?: string;
  submitText?: string;
  withOutCancelButton?: boolean;
  isDisabled?: boolean;
  withOutCloseButton?: boolean;
  isDropdown?: boolean;
  selectedWallet?: string | null;
  setSelectedWallet?: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedValue?: React.Dispatch<React.SetStateAction<string>>;
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  isError?: boolean;
  errorMessage?: string;
}

const DropdownModal = ({
                     isOpened,
                     modalHeader,
                     modalBody,
                     withOutCloseButton,
                     closeModal,
                     isDisabled,
                     withOutCancelButton,
                     cancelText = "Cancel",
                     submitText = "Submit",
                     isDropdown = false,
                   }: BaseModalProps) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { blocked, loading, data } = useBlockIp();
  
    function onClickHelper() {
		 if (selectedCountry) {
			if (
				selectedCountry === "China" || 
				selectedCountry === "Hong Kong" || 
				selectedCountry === "Republic of North Macedonia" ||
				selectedCountry === "Turkey" || 
				selectedCountry === "Ukraine" 	 
			) {
				return window.open(`https://verify-with.blockpass.org/?clientId=xai_sentry_node__edd_60145`, "_blank",
            "noopener noreferrer");
			} else if (selectedCountry !== "") {
				return window.open(`https://verify-with.blockpass.org/?clientId=xai_node_007da`, "_blank",
            "noopener noreferrer");
			}
		} else {
			return
		}
	}

  const countries: JSX.Element[] = listOfCountries.filter(item => item.label.toLocaleLowerCase().startsWith(selectedCountry?.toLowerCase()!)).map((item, i, arr) => (
    <DropdownItem
      onClick={() => {
        setSelectedCountry(item.label);
        setIsOpen(false);
      }}
      dropdownOptionsCount={arr.length}
      key={`sentry-item-${i}`}
      extraClasses={"hover:!bg-velvetBlack"}
    >
      {item.label}
    </DropdownItem>
  ));

  const isBlockedCountry = () => { 
    if((listOfCountries.find(item => item.value === data.country)?.label === selectedCountry) && blocked) {
      return true
    }
    return false
  }

  const validateAndContinue = () => { 
    if (isBlockedCountry() || loading || selectedCountry === "United States") {
      return true;
    }
    if (listOfCountries.filter(item => item.label === selectedCountry).length === 0) {
      return true;
    }
    return false;
  }

    
  useEffect(() => {
    if (isOpened) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "visible";
    }
  }, [isOpened]);
    
  return (
    <>
      {isOpened &&
        <>
          <div
            className="w-full h-full bg-black/75 fixed top-0 left-0 z-40 animate-modal-appear"
            onClick={closeModal}
          ></div>
          <div
            className="bg-black fixed top-2/4 animate-modal-appear left-2/4 -translate-x-2/4 -translate-y-2/4 z-50 h-max w-full max-w-[700px] p-[15px] border border-darkRoom">
            {!withOutCloseButton && <span
              className="absolute right-[15px] top-[22px] cursor-pointer modal-close"
              onClick={() => !isDisabled && closeModal()}
            >
              <CloseIcon
                width={15}
                height={15}
                fill="#fff"
              />
            </span>}
            <span className="block font-bold text-white text-2xl mb-[18px]">{modalHeader}</span>
            <span className="block text-[17px] font-medium text-americanSilver">{modalBody}</span>
            {isDropdown && <DropdownText  
               dropdownOptionsCount={countries.length} 
               isOpen={isOpen} 
               selectedValue={selectedCountry} 
               selectedValueRender={selectedCountry} 
               setSelectedValue={setSelectedCountry} 
               setIsOpen={setIsOpen} 
               getDropdownItems={() => countries} 
               extraClasses={{ dropdown: "!w-full my-3", dropdownOptions: "!w-full" }} 
               isInvalid={isBlockedCountry() || selectedCountry === "United States"}  
               />}
            {((selectedCountry && isBlockedCountry()) || selectedCountry === "United States") && <span className="block text-lg font-medium text-[#F76808]">{"KYC is not available for the selected country"}</span>}
            <div className="flex justify-end items-end mt-2">
              {!withOutCancelButton &&
                <div className="flex flex-row-reverse items-center gap-2">
                <TextButton buttonText={cancelText} onClick={closeModal} textClassName="!text-lg !font-bold !mr-0" />
                <PrimaryButton 
                  onClick={onClickHelper} 
                  btnText={submitText} 
                  size='sm' 
                  isDisabled={validateAndContinue()} 
                  icon={<ExternalLinkIcon extraClasses={{svgClasses: "mb-[3px] ml-[5px]", pathClasses: `${validateAndContinue() ? "!fill-elementalGrey" : "!fill-white" } group-hover:!fill-current duration-200 ease-in` }} />}
                  className="flex items-center justify-center group uppercase text-lg global-clip-btn disabled:!text-elementalGrey" />
              </div>}
            </div>
          </div>
        </>
      }
    </>
  )
    ;
};

export default DropdownModal;