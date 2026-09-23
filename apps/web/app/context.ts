import type { Repositories } from "@singology/db";
import type { DemoRole } from "@singology/shared";
import { createContext } from "react-router";

/**
 * The data seam on React Router's request context. Root middleware sets it
 * per request; loaders and actions read it with `context.get`.
 */
export const repositoriesContext = createContext<Repositories>();

/**
 * The role picked on `/demo`, read from the role cookie by root middleware.
 * `null` when no role has been picked. There is no authentication.
 */
export const demoRoleContext = createContext<DemoRole | null>(null);

/**
 * The student whose surfaces the request shows. Set by the student layout's
 * middleware (the fixed demo student in the facade; the signed-in student in the slice).
 */
export const studentIdContext = createContext<string>();
