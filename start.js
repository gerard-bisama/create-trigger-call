const forever = require('forever-monitor');

  var child = new (forever.Monitor)('server_new.js', {
    append: true,
    max:5,
    silent: false,    
    logFile:"/home/server-hit/log_webhook/forever.log",
    outFile: "/home/server-hit/log_webhook/webhook.log",
    errFile: "/home/server-hit/log_webhook/webhook_error.log",
    command: 'node --max_old_space_size=2000',
    args: []
  });

  child.on('restart', function () {
    console.log('server_new.js has been started on port 8001');
  });

  child.on('exit', function () {
    console.log('server_new.js has stoped');
  });

  child.start();
