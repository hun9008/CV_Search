export interface Region {
    sido: string;
    sigungu: string;
}

export interface JobContent {
    id: number;
    regions: Region[];
    companyName: string;
    title: string;
    department: string;
    requireExperience: string;
    jobType: string;
    requirements: string;
    preferredQualifications: string;
    idealCandidate: string;
    jobDescription: string;
    applyStartDate: string; // ISO date string
    applyEndDate: string;
    isPublic: boolean;
    createdAt: string;
    lastUpdatedAt: string;
    expiredAt: string;
    archivedAt: string;
    rawJobsText: string;
    url: string;
    favicon: string;
    regionText: string;
    isBookmarked: boolean;
}

export interface Sort {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
}

export interface Pageable {
    offset: number;
    sort: Sort;
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
}

export interface SearchResult {
    totalPages: number;
    totalElements: number;
    size: number;
    content: JobContent[];
    number: number;
    sort: Sort;
    first: boolean;
    last: boolean;
    numberOfElements: number;
    pageable: Pageable;
    empty: boolean;
}
