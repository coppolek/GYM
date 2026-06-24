import { createServerFn } from "@tanstack/react-start";

export const getYoutubeId = createServerFn({ method: "GET" })
  .validator((d: string) => d)
  .handler(async ({ data: query }) => {
    try {
      const res = await fetch(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      );
      const html = await res.text();
      const match = html.match(/"videoId":"([^"]+)"/);
      return match ? match[1] : null;
    } catch (e) {
      console.error("Youtube fetch error", e);
      return null;
    }
  });
