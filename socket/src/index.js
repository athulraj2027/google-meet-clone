"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var express_1 = require("express");
var node_http_1 = require("node:http");
var PORT = process.env.PORT;
var app = (0, express_1.default)();
var server = (0, node_http_1.createServer)(app);
console.log(PORT);
app.get("/", function (req, res) {
    res.send("<h1>Hello world</h1>");
});
server.listen(PORT, function () {
    console.log("server running at http://localhost:".concat(PORT));
});
