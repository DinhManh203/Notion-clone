import { action } from "./_generated/server";
import { v } from "convex/values";

export const searchWikipedia = action({
    args: {
        query: v.string(),
        lang: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const lang = args.lang || "vi";
        const apiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.query)}`;

        try {
            console.log(`Searching Wikipedia (${lang}):`, args.query);

            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'MiNote/1.0 (Educational Literature App)',
                }
            });

            if (!response.ok) {
                console.log(`Wikipedia not found: ${args.query}`);
                return null;
            }

            const data = await response.json();

            if (data.type === 'disambiguation' || data.type === 'no-extract') {
                console.log(`Wikipedia disambiguation or no extract: ${args.query}`);
                return null;
            }

            return {
                title: data.title,
                extract: data.extract,
                url: data.content_urls?.desktop?.page,
                thumbnail: data.thumbnail?.source,
            };
        } catch (error) {
            console.error("Wikipedia search error:", error);
            return null;
        }
    },
});
