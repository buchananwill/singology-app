import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("demo", "routes/demo.tsx"),
  layout("routes/student.layout.tsx", [
    route("student", "routes/student.home.tsx"),
    route("student/exercises/:id", "routes/student.exercise.tsx"),
    route("student/submissions/:id", "routes/student.submission.tsx"),
    route("student/progress", "routes/student.progress.tsx"),
  ]),
  layout("routes/coach.layout.tsx", [
    route("coach", "routes/coach.home.tsx"),
    route("coach/reviews/:submissionId", "routes/coach.review.tsx"),
  ]),
  layout("routes/anyRole.layout.tsx", [route("library", "routes/library.tsx")]),
  // Player regression page, deliberately not linked from the navigation.
  route("lab/player", "routes/lab.player.tsx"),
  // Worker-to-Postgres proof, deliberately not linked from the navigation.
  route("lab/db", "routes/lab.db.tsx"),
] satisfies RouteConfig;
