const fs = require("fs");
const axios = require("axios");
const Papa = require("papaparse");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const apiEndpoint = "https://alttext.ai/api/v1/images";
const apiKey = "e8ff541bd3c6b0447ce3dfe353809d16"; // Replace with your API key
const csvFilePath = "images.csv"; // Replace with the path to your CSV file

/**
 *
 * @param {*} filePath
 * @returns
 */
async function readCSV(filePath) {
  const fileContent = await readFile(filePath, "utf8");
  return new Promise((resolve) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("CSV File Contents: ", results);
        resolve(results.data);
      },
    });
  });
}

/**
 *
 * @param {*} data
 * @param {*} filePath
 */
async function writeCSV(data, filePath) {
  const csv = Papa.unparse(data);
  await writeFile(filePath, csv, "utf8");
}

/**
 *
 * @param {*} string
 * @returns
 */
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 *
 * @param {*} row
 * @returns
 */
async function makeApiRequest(row) {
  try {
    console.log("Making API request with row:", row);

    let image = {};
    ["url", "raw", "asset_id", "tags", "metadata"].forEach((field) => {
      if (row[`image.${field}`] && row[`image.${field}`].trim() !== "") {
        image[field] =
          field === "metadata"
            ? JSON.parse(row[`image.${field}`])
            : row[`image.${field}`];
      }
    });

    let requestData = { image };

    if (row.async && row.async.trim() !== "") {
      requestData.async = row.async.toLowerCase() === "true";
    }

    ["keywords", "negative_keywords"].forEach((field) => {
      if (row[field] && row[field].trim() !== "") {
        requestData[field] = row[field].split(",").map((item) => item.trim());
        if (requestData[field].length > 6) {
          throw new Error(`Too many items in ${field}`);
        }
      }
    });

    if (row.keyword_source && row.keyword_source.trim() !== "") {
      requestData.keyword_source = row.keyword_source;
    }

    if (row.gpt_prompt && row.gpt_prompt.trim() !== "") {
      if (row.gpt_prompt.length > 512) throw new Error("gpt_prompt too long");
      if (!row.gpt_prompt.includes("{{AltText}}"))
        throw new Error("gpt_prompt missing {{AltText}}");
      requestData.gpt_prompt = row.gpt_prompt;
    }

    if (row.lang && row.lang.trim() !== "") {
      requestData.lang = row.lang;
    } else {
      requestData.lang = "en";
    }

    if (
      (row["ecomm.product"] && row["ecomm.product"].trim() !== "") ||
      (row["ecomm.brand"] && row["ecomm.brand"].trim() !== "")
    ) {
      requestData.ecomm = {};
      if (row["ecomm.product"] && row["ecomm.product"].trim() !== "") {
        requestData.ecomm.product = row["ecomm.product"];
      }
      if (row["ecomm.brand"] && row["ecomm.brand"].trim() !== "") {
        requestData.ecomm.brand = row["ecomm.brand"];
      }
    }

    if (row.overwrite && row.overwrite.trim() !== "") {
      requestData.overwrite = row.overwrite.toLowerCase() === "true";
    }

    if (row.timeout_secs && row.timeout_secs.trim() !== "") {
      requestData.timeout_secs = parseInt(row.timeout_secs);
      if (requestData.timeout_secs < 5 || requestData.timeout_secs > 30)
        throw new Error("timeout_secs out of range");
    }

    if (row.webhook_url && row.webhook_url.trim() !== "") {
      if (!isValidURL(row.webhook_url)) throw new Error("Invalid webhook_url");
      requestData.webhook_url = row.webhook_url;
    }

    console.log("API request data:", requestData);

    const response = await axios.post(apiEndpoint, requestData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    console.log("API response:", response.data);

    return processApiResponse(response.data);
  } catch (error) {
    console.error("Error making API request:", error);
    return null;
  }
}

/**
 *
 * @param {*} apiResponse
 * @returns
 */
function processApiResponse(apiResponse) {
  if (apiResponse.tags) {
    apiResponse.tags = apiResponse.tags.flat().join(",");
  }

  if (apiResponse.errors) {
    apiResponse.errors = Object.entries(apiResponse.errors)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }

  return apiResponse;
}

async function processCSV(filePath) {
  console.log(`Processing CSV file: ${filePath}`);
  const rows = await readCSV(filePath);
  const updatedRows = await Promise.all(
    rows.map(async (row) => {
      const apiResponse = await makeApiRequest(row);
      return { ...row, ...apiResponse };
    })
  );

  await writeCSV(updatedRows, "updated_" + filePath);
}

processCSV(csvFilePath).then(() => console.log("CSV processing complete."));
