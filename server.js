    // server.js

    const express = require('express');
    const bodyParser = require('body-parser');
    const { enterStation } = require('./your_module_containing_enterStation');

    const app = express();
    const port = process.env.PORT || 3000;

    app.use(bodyParser.json());

    app.post('/webhook', (req, res) => {
    const userMessage = req.body.queryResult.queryText;

    try {
    if (userMessage.includes("-")) {
        const userMessageParts = userMessage.split("-");
        const originName = userMessageParts[0].trim();
        const destinationName = userMessageParts[1].trim();

        if (originName && destinationName) {
        const routeInfo = enterStation(originName, destinationName);
        const response = {
            fulfillmentText: routeInfo,
        };
        res.json(response);
        } else {
        const response = {
            fulfillmentText: "Please provide both origin and destination stations.",
        };
        res.json(response);
        }
    } else {
        const response = {
        fulfillmentText: "ขออภัย โปรดลองใหม่",  // Sorry, please try again
        };
        res.json(response);
    }
    } catch (error) {
    console.error("Error in enterStation function:", error);
    const response = {
        fulfillmentText: "An error occurred while processing your request.",
    };
    res.json(response);
    }
});

    app.listen(port, () => {
    console.log(`Webhook server is running on port ${port}`);
});
