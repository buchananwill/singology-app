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
} from "react-router";

import type { Route } from "./+types/root";
import { AppHeader } from "./components/AppHeader";
import { theme } from "./theme";

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

export default function App() {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Main>
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
    message = error.status === 404 ? "Page not found" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
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
