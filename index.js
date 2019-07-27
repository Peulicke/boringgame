var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(express.static(__dirname + '/www'));
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true, parameterLimit: 10000}));

app.listen(process.env.PORT || 1337);
