import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles/brand.css";

import {
  AppShell,
  ColorSchemeScript,
  Code,
  Container,
  MantineProvider,
  mantineHtmlProps,
  Text,
  Title,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from "react-router";

import type { Route } from "./+types/root";
import { AlphaBanner } from "./components/shell/AlphaBanner";
import { AppHeader } from "./components/shell/AppHeader";
import { RoleNav } from "./components/shell/RoleNav";
import { meContext } from "./context";
import { describeRouteError } from "./lib/describeRouteError";
import { meMiddleware } from "./middleware/me";
import { repositoriesMiddleware } from "./middleware/repositories";
import { sessionMiddleware } from "./middleware/session";
import { cssVariablesResolver, theme } from "./theme";

export const middleware: Route.MiddlewareFunction[] = [
  sessionMiddleware,
  repositoriesMiddleware,
  meMiddleware,
];

export function loader({ context }: Route.LoaderArgs) {
  return { me: context.get(meContext) };
}

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,400;1,6..96,500&family=Jost:wght@300;400;500;600;700&display=swap";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_HREF} />
        <ColorSchemeScript defaultColorScheme="light" />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider
          theme={theme}
          cssVariablesResolver={cssVariablesResolver}
          defaultColorScheme="light"
        >
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
  const { title, details, stack } = describeRouteError(error, import.meta.env.DEV);
  return (
    <Container component="main" py="xl">
      <Title order={1}>{title}</Title>
      <Text>{details}</Text>
      {stack && <Code block>{stack}</Code>}
    </Container>
  );
}
