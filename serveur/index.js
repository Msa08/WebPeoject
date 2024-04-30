process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    // Ignore the punycode deprecation warning
    return;
  }
  console.warn(warning);
});
require('./app/data_bases/user.js');
require('./app/data_bases/twist.js');
const connectDB = require('./app/db.js');

const express= require('express');
connectDB();
const app = express();
app.use('/twist',require('./app/data_bases/twist.js'));
app.use('/user',require('./app/data_bases/user.js'));
app.use('/chat',require('./app/data_bases/chat.js'));
app.use('/stats',require('./app/data_bases/stats.js'))
app.use('/search',require('./app/data_bases/research.js'))
app.listen(4000, () => { console.log("Serveur prêt ! 4000") })
