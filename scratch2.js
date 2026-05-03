const blob = require('@vercel/blob');
console.log(blob.get ? blob.get.toString() : 'no get');
console.log(blob.head ? blob.head.toString() : 'no head');
