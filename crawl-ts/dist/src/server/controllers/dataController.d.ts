import { Request, Response, NextFunction } from 'express';
declare const _default: {
    getResults: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getUrlDetails: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getDomainStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    resetVisitedStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getFavicon: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAllFavicons: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
