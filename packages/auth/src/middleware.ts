import { authMiddleware } from "@clerk/nextjs";

export const createAuthMiddleware = (publicRoutes: string[] = []) => {
  return authMiddleware({
    publicRoutes: [
      "/",
      "/pricing",
      "/api/webhooks/(.*)",
      ...publicRoutes,
    ],
  });
};

export default createAuthMiddleware();
