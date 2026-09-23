import type { Repositories } from "@singology/db";
import type { DemoRole } from "@singology/shared";
import { createContext } from "react-router";

/**
 * The data seam on React Router's request context. Root middleware sets it
 * per request; loaders and actions read it with `context.get`.
 */
export const repositoriesContext = createContext<Repositories>();

/**
 * The request time, set by root middleware with the repositories. Fixture
 * times are resolved against it, and loaders send it to the page so countdowns
 * render on the server from the same instant (journal decision 32).
 */
export const requestTimeContext = createContext<Date>();

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

/**
 * The coach whose surfaces the request shows. Set by the coach layout's
 * middleware (the fixed demo coach in the facade; the signed-in coach in the slice).
 */
export const coachIdContext = createContext<string>();
