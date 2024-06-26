
export const SENTRY_DEV_URL = "https://cryptitaustria.github.io/sentry/"
export const SENTRY_LOCAL_URL = "http://localhost:5173/sentry"
export const SENTRY_PROD_URL = "https://sentry.xai.games/"

export const STAKING_DEV_URL = "https://xai-staking-int.dev.cryptit.at/";
export const STAKING_LOCAL_URL = "http://localhost:3000/";
export const STAKING_PROD_URL = "https://app.xai.games/"

//todo improve constants

export interface IRedirects {
    "http://localhost:5173/sentry": string;
    "https://cryptitaustria.github.io/sentry/": string;
    "https://sentry.xai.games/": string;
}

export const redirects: IRedirects = {
    "http://localhost:5173/sentry": STAKING_LOCAL_URL,
    "https://cryptitaustria.github.io/sentry/": STAKING_DEV_URL,
    "https://sentry.xai.games/": STAKING_PROD_URL
}