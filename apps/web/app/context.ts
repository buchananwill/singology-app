import type { Repositories } from "@singology/db";
import type { DemoRole } from "@singology/shared";
import { createContext } from "react-router";

export const repositoriesContext = createContext<Repositories>();

/** Loaders send it to the page, so countdowns render on the server from the same instant. */
export const requestTimeContext = createContext<Date>();

/** Not authentication: only which view the visitor picked on `/demo`. */
export const demoRoleContext = createContext<DemoRole | null>(null);

/** The fixed demo student in the facade; the signed-in student in the slice. */
export const studentIdContext = createContext<string>();

/** The fixed demo coach in the facade; the signed-in coach in the slice. */
export const coachIdContext = createContext<string>();
