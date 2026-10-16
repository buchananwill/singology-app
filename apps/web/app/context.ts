import type { Claims, Repositories } from "@singology/db";
import type { DemoRole, Me } from "@singology/shared";
import { createContext } from "react-router";

/** The verified session claims, or `anon`; the only input to the database's RLS. */
export const claimsContext = createContext<Claims>({ role: "anon" });

export const repositoriesContext = createContext<Repositories>();

/** Loaders send it to the page, so countdowns render on the server from the same instant. */
export const requestTimeContext = createContext<Date>();

/** The signed-in user and their roles; `null` when anonymous. */
export const meContext = createContext<Me | null>(null);

/** Not authentication: only which view the visitor picked on `/demo`. */
export const demoRoleContext = createContext<DemoRole | null>(null);

/** Set by the student layout from the signed-in user's student row. */
export const studentIdContext = createContext<string>();

/** Set by the coach layout from the signed-in user's coach row. */
export const coachIdContext = createContext<string>();
