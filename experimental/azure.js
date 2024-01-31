const axios = require('axios');

const endpoint = "https://altifier.cognitiveservices.azure.com/";
const region = "eastus";
const key1 = "8d306b99593741e09e529c46e5284ddf";  // Make sure to secure your keys
const key2 = "5984c79d68134a4c84c2c4a8907a468f";  // Don't expose them in your code

const apiVersion = "2023-10-01";
const features = "tags,read,caption,denseCaptions,objects,people";
const modelVersion = "latest";
const language = "en";
const genderNeutralCaption = "false";

let fullEndpoint = endpoint + "computervision/imageanalysis:analyze?";
fullEndpoint += "api-version=" + apiVersion;
fullEndpoint += "&features=" + features;
fullEndpoint += "&model-version=" + modelVersion;
fullEndpoint += "&language=" + language;
fullEndpoint += "&gender-neutral-caption=" + genderNeutralCaption;

// Image URL to analyze
const imageUrl = 'https://static.summitracing.com/global/images/prod/xlarge/edl-1406_bn_xl.jpg'; // Replace with your image URL

// Function to make the POST request
async function analyzeImage(imageUrl) {
    try {
        const response = await axios.post(fullEndpoint, { url: imageUrl }, {
            headers: {
                'Ocp-Apim-Subscription-Key': key1,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response: ', JSON.stringify(response.data));
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the function with the image URL
analyzeImage(imageUrl);
