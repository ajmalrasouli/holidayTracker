import { Configuration, PopupRequest, LogLevel } from '@azure/msal-browser';

const productionUrl = 'https://witty-tree-0eeecf003.1.azurestaticapps.net';
const isProduction = process.env.NODE_ENV === 'production';

export const msalConfig: Configuration = {
    auth: {
        clientId: process.env.REACT_APP_AUTH_CLIENT_ID || 'de78aaf8-431d-469f-a471-edf3fd013a7c',
        authority: 'https://login.microsoftonline.com/6220fa65-7006-464b-877d-fa76518414ce',
        redirectUri: isProduction ? productionUrl : 'http://localhost:3000',
        postLogoutRedirectUri: isProduction ? productionUrl : 'http://localhost:3000',
        navigateToLoginRequestUrl: true,
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: true, // Set to true for IE11
        secureCookies: isProduction // Enable secure cookies in production
    },
    system: {
        loggerOptions: {
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        break;
                    case LogLevel.Info:
                        console.info(message);
                        break;
                    case LogLevel.Verbose:
                        console.debug(message);
                        break;
                    case LogLevel.Warning:
                        console.warn(message);
                        break;
                }
            },
            piiLoggingEnabled: false
        },
        windowHashTimeout: 60000,
        iframeHashTimeout: 6000,
        loadFrameTimeout: 6000
    }
};

export const loginRequest: PopupRequest = {
    scopes: ['User.Read', 'profile', 'email', 'openid'],
    prompt: 'select_account'
};

export const azureConfig = {
    staticWebAppUrl: process.env.REACT_APP_STATIC_WEB_APP_URL || productionUrl,
    cosmosDb: {
        endpoint: process.env.REACT_APP_COSMOS_ENDPOINT || '',
        databaseId: 'HolidayTracker',
        containerId: 'UserData'
    }
};