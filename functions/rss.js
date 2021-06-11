const https = require("https");

async function getPosts() {
  return new Promise((resolve, reject) => {
    const query = '{ 
      query : {
        getSwellcast(alias:"technews",offset:1,limit:1){
          id
          swells{
            id
            createdOn
            canonicalId
            title
            description
            audio{
              url
            }
          }
        }
      }`;

    const options = {
      protocol: "https:",
      hostname: "widgetapi.swell.life",
      path: "/graphql",
      method: "POST",
    };

    let posts = "";

    const req = https.request(options, (res) => {
      res.on("data", (data) => {
        posts += data;
      });

      res.on("end", () => {
        const parsedPosts = JSON.parse(posts);
        resolve(parsedPosts.data.microblogCollection.items);
      });
    });

    req.on("error", (e) => {
      console.error(e);
    });

    req.write(JSON.stringify({ query }));
    req.end();
  });
}

function buildRssItems(response) {
  const truncateLength = 44;
  const items= response.data.getSwellcast.swells
  return items
    .map((item) => {
      const title = item.title;
      const desc = item.description;
      const audio = item.audio.url;
     
      return `
        <item>
        <title>${title}</title>
        <description>${description}</description>
        <author>Satheesh</author>
        <link>${audio}</link>
        <guid>${item.canonicalId}</guid>
        <pubDate>${item.createdOn}</pubDate>
        </item>
        `;
    })
    .join("");
}

exports.handler = async function (event, context) {
  const rssFeed = `<?xml version="1.0"?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Tech News Swellcast</title>
    <atom:link href="https://reverent-albattani-08df3f.netlify.app/.netlify/functions/rss" rel="self" type="application/rss+xml" />
    <link>https://swellcast.com/technews</link>
    <description>Swellcast by Satheesh </description>
    ${buildRssItems(await getPosts())}
  </channel>
  </rss>`;

  return {
    statusCode: 200,
    contentType: "text/xml",
    body: rssFeed,
  };
};
