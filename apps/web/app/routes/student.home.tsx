import { Container, Title } from "@mantine/core";

import { repositoriesContext, studentIdContext } from "../context";
import type { Route } from "./+types/student.home";

export const meta: Route.MetaFunction = () => [{ title: "This week | Singology" }];

export async function loader({ context }: Route.LoaderArgs) {
  const student = await context.get(repositoriesContext).students.get(context.get(studentIdContext));
  return { studentName: student?.displayName ?? "" };
}

export default function StudentHome({ loaderData }: Route.ComponentProps) {
  return (
    <Container size="md">
      <Title order={1}>This week</Title>
      {loaderData.studentName}
    </Container>
  );
}
