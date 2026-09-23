import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // Player regression page (stage 2); deliberately not linked from the navigation.
  route("lab/player", "routes/lab.player.tsx"),
] satisfies RouteConfig;
