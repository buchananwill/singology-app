import type { Repositories } from "@singology/db";
import { createContext } from "react-router";

/**
 * The data seam on React Router's request context. Root middleware sets it
 * per request; loaders and actions read it with `context.get`.
 */
export const repositoriesContext = createContext<Repositories>();
