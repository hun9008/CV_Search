interface Job {
    id: number;
    region: {
        id: number | null;
        cd: string | null;
        sido: string | null;
        sigungu: string | null;
    } | null;
    companyName: string;
    title: string;
    department: string | null;
    requireExperience: string | null;
    jobType: string | null;
    requirements: string | null;
    preferredQualifications: string | null;
    idealCandidate: string | null;
    jobDescription: string;
    applyStartDate: string | null;
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
    score: number | null;
    cosineScore: number | null;
    bm25Score: number | null;
    isBookmarked: false;
}

export default Job;
