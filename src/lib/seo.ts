export const seo = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} · Metro Admin TP.HCM` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · Metro Admin TP.HCM` },
    { property: "og:description", content: description },
  ],
});
