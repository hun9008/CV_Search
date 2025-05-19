import { WebCrawler } from './WebCrawler';
export declare class ConcurrentWebCrawler {
    private crawler;
    private concurrency;
    constructor(crawler: WebCrawler, concurrency?: number);
    run(): Promise<void>;
}
