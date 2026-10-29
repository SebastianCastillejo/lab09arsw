var express = require('express');
var FibonacciService = require('./Services/FibonacciService')

var app = express();

app.get('/fibonacci/:nthIn', function (req, res) {
  var nth = FibonacciService.getNthNumberInSequence(parseInt(req.params.nthIn))
  res.send('The answer is ' + nth);
});

app.get('/', function (req, res) {  
  res.send('Hello World');
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Fibonacci App listening on port ' + port + '!');
});