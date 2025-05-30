export interface JobBrief {
    id: number;
    companyName: string;
    title: string;
    jobVaildType: number | null;
    isPublic: boolean | null;
    createdAt: string;
    applyEndDate: string | null;
    url: string | null;
}
