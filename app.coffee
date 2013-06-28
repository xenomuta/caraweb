cv = require('opencv')
fs = require('fs')
app = require('http').createServer (req, res) ->
  file = if req.url is '/' then '/index.html' else req.url
  console.log "#{req.method} #{file}"
  fs.readFile "./static#{file}", (err, data) ->
    if err?
      res.write(404)
      return res.end "<h1>HTTP 404 - Not Found</h1>"
    res.writeHead(200)
    res.end data

io = require('socket.io').listen(app).on 'connection', (socket) ->
  socket.on 'frame', (data) ->
    return unless typeof(data) is 'string'
    data = data?.split(',')?[1]
    # Caras
    cv.readImage (new Buffer data, 'base64'), (err, im) ->
      im.detectObject "./node_modules/opencv/data/haarcascade_frontalface_alt2.xml", {}, (err, caras) ->
        return socket.emit('caras', []) unless caras?.length > 0
        # Ojos
        im.detectObject "./node_modules/opencv/data/haarcascade_eye.xml", {}, (err, ojos) ->
          return socket.emit('caras', []) if err?
          rects = (caras or []).map (cara) ->
            cara.ojos = (ojos or []).filter (ojo) ->
              ojo.x > cara.x and ojo.y > cara.y and (ojo.x + ojo.width) < (cara.x + cara.width) and (ojo.y + ojo.height) < (cara.y + cara.height)
            cara
          .filter (cara) -> # Solo caras grandes...
            # cara.ojos?.length is 2 and cara.width * cara.height > (320 * 240) / 8
            cara.width * cara.height > (320 * 240) / 12
          # console.log JSON.stringify rects
          socket.volatile.emit('caras', rects)

io.disable('sync disconnect on unload')
io.enable('browser client minification')
io.enable('browser client etag')
io.enable('browser client gzip')
# io.enable('log');
io.set('log level', 1)
io.set('transports', [
    'websocket'
  # 'flashsocket'
  # 'htmlfile'
  'xhr-polling'
  'jsonp-polling'
])
      
app.listen(9999)

process.on 'uncaughtException', (err) ->
  console.error(err)
  socket?.emit('caras', []) 