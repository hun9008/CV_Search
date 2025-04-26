/**
 * SubUrl interface representing a URL to be visited or that has been visited
 */
export interface SubUrl {
    url: string;
    domain: string;
    visited?: boolean;
    visitedAt?: Date;
    success?: boolean;
    title?: string;
    text?: string;
    crawlStats?: {
        total?: number;
        href?: number;
        onclick?: number;
        blocked_by_robots?: number;
        allowed_after_robots?: number;
    };
    crawledUrls?: string[];
    herfUrls?: string[];
    onclickUrls?: string[];
    finalUrl?: string;
    finalDomain?: string;
    errors?: any[];
    isRecruit?: boolean;
    isRecruit_claude?: boolean;
    updated_at?: Date;
    created_at?: Date;
    discoveredAt?: Date;
    meta?: Record<string, any>;
}
