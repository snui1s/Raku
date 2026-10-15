import { defineRouteMiddleware } from "@astrojs/starlight/route-data";

export const onRequest = defineRouteMiddleware(({ locals }, next) => {
  const route = locals.starlightRoute;
  if (route.toc) {
    // Remove the automatic page-top entry from both desktop and mobile contents.
    // Keep any headings nested beneath it on pages that begin with a subheading.
    route.toc.items = route.toc.items.flatMap((item) => item.slug === "_top" ? item.children : [item]);
    if (route.toc.items.length === 0) route.toc = undefined;
  }
  return next();
});
