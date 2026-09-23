import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [{ title: "Singology" }];

export default function Home() {
  return (
    <main>
      <h1>Singology</h1>
    </main>
  );
}
