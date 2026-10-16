import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import {
  AppShell,
  ColorSchemeScript,
  Container,
  MantineProvider,
  mantineHtmlProps,
  Text,
  Title,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import { AlphaBanner } from "./components/shell/AlphaBanner";
import { AppHeader } from "./components/shell/AppHeader";
import { RoleNav } from "./components/shell/RoleNav";
import { meContext } from "./context";
import { meMiddleware } from "./middleware/me";
import { repositoriesMiddleware } from "./middleware/repositories";
import { sessionMiddleware } from "./middleware/session";
import { theme } from "./theme";

export const middleware: Route.MiddlewareFunction[] = [
  sessionMiddleware,
  repositoriesMiddleware,
  meMiddleware,
];

export function loader({ context }: Route.LoaderArgs) {
  return { me: context.get(meContext) };
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ColorSchemeScript defaultColorScheme="light" />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications />
          {children}
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { me } = loaderData;
  const isLanding = useLocation().pathname === "/";
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <AppHeader me={me} />
      </AppShell.Header>
      <AppShell.Main>
        {!isLanding && (
          <Container size="md">
            <AlphaBanner />
            {me !== null && <RoleNav me={me} />}
          </Container>
        )}
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something went wrong";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      message = "Page not found";
      details = "The requested page could not be found.";
    } else if (error.status === 403) {
      message = "Not available to your account";
      details = "This page is for a role your account does not hold.";
    } else {
      message = "Error";
      details = error.statusText || details;
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Container component="main" py="xl">
      <Title order={1}>{message}</Title>
      <Text>{details}</Text>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </Container>
  );
}
