import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { navGroups } from "@/components/app-shell";
import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches the public login route", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    expect(router.matchRoutes("/login").at(-1)?.routeId).toBe("/login");
  });

  it("matches a registered route for every sidebar destination", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const destinations = navGroups.flatMap((group) => group.items.map((item) => item.to));

    for (const destination of destinations) {
      const matches = router.matchRoutes(destination);
      expect(matches.at(-1)?.routeId, destination).not.toBe(rootRouteId);
    }
  });
});
