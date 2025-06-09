export interface Region {
    sido: string | null;
    sigungu: string | null;
}

export interface JobContent {
    id: number;
    regions: Region[] | null;
    companyName: string;
    title: string;
    department: string | null;
    requireExperience: string | null;
    jobType: string | null;
    requirements: string | null;
    preferredQualifications: string | null;
    idealCandidate: string | null;
    jobDescription: string;
    applyStartDate: string | null; // ISO date string
    applyEndDate: string | null;
    isPublic: boolean | null;
    createdAt: string | null;
    lastUpdatedAt: string | null;
    expiredAt: string | null;
    archivedAt: string | null;
    rawJobsText: string | null;
    url: string | null;
    favicon: string | null;
    regionText: string | null;
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
