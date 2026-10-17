import { isRouteErrorResponse } from "react-router";

export interface RouteErrorCopy {
  title: string;
  details: string;
  /** Only in development, for an unexpected exception. */
  stack?: string;
}

const STATUS_COPY: Record<number, Omit<RouteErrorCopy, "stack">> = {
  403: {
    title: "Not available to your account",
    details: "This page is for a role your account does not hold.",
  },
  404: { title: "Page not found", details: "The requested page could not be found." },
};

const UNEXPECTED: RouteErrorCopy = {
  title: "Something went wrong",
  details: "An unexpected error occurred.",
};

export function describeRouteError(error: unknown, dev: boolean): RouteErrorCopy {
  if (isRouteErrorResponse(error)) {
    return (
      STATUS_COPY[error.status] ?? {
        title: "Error",
        details: error.statusText || UNEXPECTED.details,
      }
    );
  }
  if (dev && error instanceof Error) {
    return { ...UNEXPECTED, details: error.message, stack: error.stack };
  }
  return UNEXPECTED;
}
