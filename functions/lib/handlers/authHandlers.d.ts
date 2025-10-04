/**
 * TaskFlow Authentication HTTP Handlers
 * Express routes for user authentication and profile management
 */
import { Request, Response } from 'express';
export declare const authHandlers: import("express-serve-static-core").Router;
/**
 * Middleware to verify Firebase ID token
 */
declare function authenticateUser(req: Request, res: Response, next: any): Promise<void>;
export { authenticateUser };
//# sourceMappingURL=authHandlers.d.ts.map