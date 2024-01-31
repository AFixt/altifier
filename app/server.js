const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const config = require("../config.json");

app.use(cors());
app.use(express.json());

const endpoint = `${config.resource}computervision/imageanalysis:analyze?` +
                 `api-version=${config.apiVersion}&features=${config.features}` +
                 `&model-version=${config.modelVersion}&language=${config.language}` +
                 `&gender-neutral-caption=${config.genderNeutralCaption}`;

app.post("/", async (req, res) => {
    const imageUrl = req.body.url;
    console.log("imageUrl: ", imageUrl);

    if (!imageUrl) {
        return res.status(400).send({ error: "URL parameter is required" });
    }

    try {
        const response = await axios.post(endpoint, { url: imageUrl }, {
            headers: {
                "Ocp-Apim-Subscription-Key": config.key1,
                "Content-Type": "application/json",
            },
            timeout: 10000,
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send({ error: "Internal Server Error", details: error.message });
    }
});

// Catch-all for any other method not explicitly handled above
app.all("/", (req, res) => {
    res.status(405).send({ error: "Method Not Allowed" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
