export const seo = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} · HopOn` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · HopOn` },
    { property: "og:description", content: description },
  ],
});
