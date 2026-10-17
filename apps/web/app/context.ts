import type { Claims, Repositories } from "@singology/db";
import type { Me } from "@singology/shared";
import { createContext } from "react-router";

import type { SupabaseForRequest } from "./auth/supabase.server";

/** The verified session claims, or `anon`; the only input to the database's RLS. */
export const claimsContext = createContext<Claims>({ role: "anon" });

/** The request's one Supabase client; the session middleware puts its headers on the response. */
export const supabaseContext = createContext<SupabaseForRequest>();

export const repositoriesContext = createContext<Repositories>();

/** Loaders send it to the page, so countdowns render on the server from the same instant. */
export const requestTimeContext = createContext<Date>();

export const meContext = createContext<Me | null>(null);

/** Set by the student layout from the signed-in user's student row. */
export const studentIdContext = createContext<string>();

/** Set by the coach layout from the signed-in user's coach row. */
export const coachIdContext = createContext<string>();
