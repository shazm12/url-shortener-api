import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
openapi:"3.0.0",
info: {
title:"URL Shortener API",
version:"1.0.0",
description:"API to get Shorten URL for your Long URLs along with Analytics for your Short URL- Number of Clicks,Unique User and more...",
},
};

const options = {
swaggerDefinition,
apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;