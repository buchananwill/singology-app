import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("demo", "routes/demo.tsx"),
  layout("routes/student.layout.tsx", [
    route("student", "routes/student.home.tsx"),
    route("student/exercises/:id", "routes/student.exercise.tsx"),
  ]),
  layout("routes/coach.layout.tsx", [route("coach", "routes/coach.home.tsx")]),
  // Player regression page (stage 2); deliberately not linked from the navigation.
  route("lab/player", "routes/lab.player.tsx"),
] satisfies RouteConfig;
