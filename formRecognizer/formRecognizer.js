const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");
const { Readable } = require('stream');
require("dotenv").config();

const apiKey = process.env.AZURE_FORM_KEY;
const endpoint = process.env.AZURE_FORM_ENDPOINT;

const fs = require("fs");

async function processFormUrl(base64String) {
    try{

      //Remove the prefix to get just the base64-encoded data
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
      // Convert the base64-encoded data to a Buffer
      const buffer = Buffer.from(base64Data, "base64");
      // Create a readable stream from the buffer
      const readStream = Readable.from(buffer);

      const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
      const poller = await client.beginAnalyzeDocument('prebuilt-document',readStream, {
        contentType: ["image/jpg", "image/jpeg", "image/png"],
        onProgress: (state) => {
          console.log(`status: ${state.status}`);
        }
      });
    
      const idDocument = await poller.pollUntilDone();
    
      if (idDocument === undefined) {
        throw new Error("Failed to extract data from at least one identity document.");
      }
      
      return idDocument.keyValuePairs;
      
    } catch(error) {
        console.error("An error occurred:", error);
    }
}

module.exports = {
    processFormUrl
};