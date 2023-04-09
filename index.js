import fetch from "node-fetch";
import { stringify } from "yaml";
import { writeFileSync } from "fs";
import * as dotenv from "dotenv";
dotenv.config();

// Functions to extract data from Notion
const typeExtraction = {
  rich_text: getRichText,
  select: getSelect,
  title: getTitle,
  url: getUrl,
  number: getNumber,
  date: getDate,
  relation: getRelation,
};

// Values to extract from Notion and their
// corresponding Hayagriva keys
const values = [
  {
    hayagriva: "type",
    notion: "Type",
    mandatory: true,
  },
  {
    hayagriva: "ISSN",
    notion: "Issn",
  },
  {
    hayagriva: "title",
    notion: "Title",
    mandatory: true,
  },
  {
    hayagriva: "doi",
    notion: "DOI",
    escapted: true,
  },
  {
    hayagriva: "author",
    notion: "Autoren",
    mandatory: true,
  },
  {
    hayagriva: "date",
    notion: "Datum",
    mandatory: true,
  },
  {
    hayagriva: "publisher",
    notion: "Verlag",
  },
  {
    hayagriva: "issue",
    notion: "Issue",
  },
  {
    hayagriva: "isbn",
    notion: "ISBN",
  },
  {
    hayagriva: "volume",
    notion: "Volume",
  },
  {
    hayagriva: "organization",
    notion: "Organisation",
  },
  {
    hayagriva: "url",
    notion: "URL",
  },
  {
    hayagriva: "location",
    notion: "Ort",
  },
  {
    hayagriva: "parent",
    notion: "Parent",
  },
];

const dataBaseFetchOptions = {
  method: "POST",
  headers: {
    Authorization: "Bearer " + process.env.NOTION_TOKEN,
    accept: "application/json",
    "Notion-Version": "2022-06-28",
    "content-type": "application/json",
  },
  body: JSON.stringify({ page_size: 100 }),
};

if (!process.env.NOTION_DB_ID)
  throw new Error(
    "No database ID specified. Please set the NOTION_DB_ID environment variable."
  );
if (!process.env.NOTION_TOKEN)
  throw new Error(
    "No Notion token specified. Please set the NOTION_TOKEN environment variable."
  );

fetch(
  "https://api.notion.com/v1/databases/" + process.env.NOTION_DB_ID + "/query",
  dataBaseFetchOptions
)
  .then((response) => response.json())
  .then((response) => loopThroughResults(response))
  .catch((err) => console.error(err));

async function loopThroughResults(data) {
  const results = data.results;
  let hayagrivaObjects = [];
  for (let i = 0; i < results.length; i++) {
    hayagrivaObjects +=
      "\n" + stringify(await constructHayagrivaObject(results[i], true));
  }
  //   console.log(hayagrivaObjects);
  writeFileSync("hayagriva.yml", hayagrivaObjects);
}

async function constructHayagrivaObject(data, toplevel = false) {
  data = data.properties;

  let key;

  if (toplevel) {
    key = await typeExtraction[data["Key"]["type"]](data["Key"]);
  }

  let hayagrivaObject = {};
  for (let i = 0; i < values.length; i++) {
    const hayagrivaKey = values[i].hayagriva;
    const notionKey = values[i].notion;
    const mandatory = values[i].mandatory;
    if (data[notionKey]) {
      //   console.log(data[notionKey]);
      let localdata = data[notionKey];

      if (notionKey === "URL") {
        localdata = {
          url: data[notionKey],
          datum: data["Abrufdatum"],
        };
      }

      const extracted = await typeExtraction[data[notionKey]["type"]](
        localdata
      );
      if (values[i].escaped) extracted = '"' + extracted + '"';
      if (extracted) hayagrivaObject[hayagrivaKey] = extracted;
      else if (mandatory) {
        // hayagrivaObject[hayagrivaKey] = "";
        console.log(
          "\x1b[31mMissing mandatory field at " + key + ": " + hayagrivaKey
        );
      }
    }
  }

  if (toplevel) {
    let tempObject = {};
    tempObject[key] = hayagrivaObject;
    hayagrivaObject = tempObject;
  }

  return hayagrivaObject;
}

function getRichText(data) {
  if (!data.rich_text) return undefined;
  if (data.rich_text.length === 0) return undefined;
  return data.rich_text[0].plain_text;
}

function getSelect(data) {
  if (data.select) {
    return data.select.name;
  }
  return undefined;
}

function getTitle(data) {
  //   console.log(data.title);
  if (data.title.length === 0) return undefined;
  if (data.title[0].plain_text) return data.title[0].plain_text;
  else if (data.title[1].plain_text) return data.title[1].plain_text;
}

async function getUrl(data) {
  if (!data.url.url) return undefined;
  let result = data.url.url;

  let abrufdatum = await typeExtraction[data.datum["type"]](data.datum);
  if (abrufdatum) {
    result = {
      value: data.url.url,
      date: abrufdatum,
    };
  }
  return result;
}

function getNumber(data) {
  return data.number;
}

function getDate(data) {
  if (!data.date) return undefined;
  return data.date.start;
}

async function getRelation(data) {
  if (!data.relation) return undefined;
  if (!data.relation.length === 0) return undefined;
  const relationTypes = {
    LX_z: getAuthors,
    "%3BhNN": constructHayagrivaObject,
  };

  const id = data.id;
  if (!relationTypes[id]) return undefined;

  let pages = [];

  for (let i = 0; i < data.relation.length; i++) {
    pages.push(await fetchPage(data.relation[i].id));
  }

  if (pages) {
    if (pages.length === 0) return undefined;
    if (id === "LX_z") return getAuthors(pages);
    else {
      return relationTypes[id](pages[0]);
    }
  }

  return undefined;
}

function getAuthors(data) {
  let authors = [];

  for (let i = 0; i < data.length; i++) {
    let vorname = getRichText(data[i].properties["Vorname"]);
    let nachname = getTitle(data[i].properties["Nachname"]);

    if (vorname && nachname) {
      authors.push(nachname + ", " + vorname);
    } else if (nachname) {
      authors.push(nachname);
    } else if (vorname) {
      authors.push(vorname);
    }
  }

  return authors;
}

async function fetchPage(id) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "Notion-Version": "2022-06-28",
      Authorization: "Bearer " + process.env.NOTION_TOKEN,
    },
  };

  let response = await fetch("https://api.notion.com/v1/pages/" + id, options);

  let data = await response.json();

  return data;
}
