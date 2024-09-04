import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import SearchBar from "./SearchBar";
import Link from "next/link";

// Helper function to convert text to slug
function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "");
}

// Helper function to add hyperlinks
function addHyperlinks(text, keywords) {
  let result = text;
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    result = result.replace(regex, `<hyperlink>${keyword}</hyperlink>`);
  });
  return result;
}

// Component to render text with hyperlinks
function RenderWithHyperlinks({ text }) {
  const parts = text.split(/(<hyperlink>.*?<\/hyperlink>)/);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("<hyperlink>")) {
          const keyword = part.replace(/<\/?hyperlink>/g, "");
          return (
            <Link
              key={index}
              href={`/${toSlug(keyword)}`}
              className="text-blue-600 underline"
            >
              {keyword}
            </Link>
          );
        }
        return part;
      })}
    </>
  );
}

export default async function Home({ params }) {
  const input = params.slug || "Wikipedia";
  
  const { object } = await generateObject({
    model: openai("gpt-4"),
    schema: z.object({
      wikipedia_article_title: z.string(),
      wikipedia_article_initial_summary: z.string(),
      wikipedia_article_sections: z.array(
        z.object({
          header: z.string(),
          content: z.string(),
        })
      ),
      info_card: z.object({
        categories: z.array(z.string()),
        values: z.array(z.string()),
      }),
      potential_hyperlinks: z.array(z.string()),
    }),
    prompt: `Create a long-form Wikipedia style article about: ${input}. Include an info card with relevant categories and their corresponding values. For each section, provide a header and detailed content, and create many different sections. Also, provide an array of potential hyperlinks (important keywords or phrases) that could be linked to other Wikipedia articles.`,
  });

  // Process the content to add hyperlinks
  const processedSummary = addHyperlinks(
    object.wikipedia_article_initial_summary,
    object.potential_hyperlinks
  );
  const processedSections = object.wikipedia_article_sections.map(
    (section) => ({
      ...section,
      content: addHyperlinks(section.content, object.potential_hyperlinks),
    })
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md relative">
      <SearchBar />

      <h1 className="text-3xl font-bold font-serif mb-4 pb-2 border-b">
        {object.wikipedia_article_title}
      </h1>

      <div className="float-right ml-6 mb-6 w-64 bg-gray-100 border border-gray-300 rounded-lg overflow-hidden">
        <h2 className="text-lg font-semibold bg-gray-200 p-2 text-center">
          Quick Facts
        </h2>
        <table className="w-full text-sm">
          <tbody>
            {object.info_card.categories.map((category, index) => (
              <tr
                key={index}
                className="border-b border-gray-300 last:border-b-0"
              >
                <td className="py-2 px-3 font-semibold align-top">
                  {category}
                </td>
                <td className="py-2 px-3 align-top">
                  <RenderWithHyperlinks
                    text={addHyperlinks(
                      object.info_card.values[index],
                      object.potential_hyperlinks
                    )}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mb-6">
        <RenderWithHyperlinks text={processedSummary} />
      </p>
      <div className="space-y-4">
        {processedSections.map((section, index) => (
          <div key={index}>
            <h2 className="text-2xl font-semibold mt-6 mb-3">
              {section.header}
            </h2>
            <hr />
            <p className="mt-2">
              <RenderWithHyperlinks text={section.content} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
