'use client'

import { useState, useEffect } from 'react';

export default function WikiContent({ stream }) {
  const [content, setContent] = useState({
    wikipedia_article_title: '',
    wikipedia_article_initial_summary: '',
    wikipedia_article_sections: [],
    info_card: { categories: [], values: [] },
  });

  useEffect(() => {
    const updateContent = async () => {
      for await (const chunk of stream.partialObjectStream) {
        setContent(prevContent => ({ ...prevContent, ...chunk }));
      }
    };

    updateContent();
  }, [stream]);

  return (
    <>
      <h1 className="text-3xl font-bold font-serif mb-4 pb-2 border-b">
        {content.wikipedia_article_title}
      </h1>

      {content.info_card.categories.length > 0 && (
        <div className="float-right ml-6 mb-6 w-64 bg-gray-100 border border-gray-300 rounded-lg overflow-hidden">
          <h2 className="text-lg font-semibold bg-gray-200 p-2 text-center">
            Quick Facts
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {content.info_card.categories.map((category, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-300 last:border-b-0"
                >
                  <td className="py-2 px-3 font-semibold align-top">
                    {category}
                  </td>
                  <td className="py-2 px-3 align-top">
                    {content.info_card.values[index]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mb-6">{content.wikipedia_article_initial_summary}</p>
      <div className="space-y-4">
        {content.wikipedia_article_sections.map((section, index) => (
          <div key={index}>
            <h2 className="text-2xl font-semibold mt-6 mb-3">
              {section.header}
            </h2>
            <hr />
            <p className="mt-2">{section.content}</p>
          </div>
        ))}
      </div>
    </>
  );
}