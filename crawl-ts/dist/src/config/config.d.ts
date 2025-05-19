declare const _default: {
    CRAWLER: {
        START_URL: string;
        DELAY_BETWEEN_REQUESTS: number;
        MAX_URLS: number;
        STRATEGY: string;
        BASE_DOMAIN: string;
    };
    BROWSER: {
        HEADLESS: boolean;
        LAUNCH_ARGS: string[];
        TIMEOUT: {
            PAGE_LOAD: number;
            SCRIPT_EXECUTION: number;
        };
    };
    PATHS: {
        ERROR_SCREENSHOTS_DIR: string;
    };
    DATABASE: {
        MONGODB_URI: string;
    };
    RABBITMQ_URL: string;
    RABBITMQ_QUEUE: string;
};
export default _default;
