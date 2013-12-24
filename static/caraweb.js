    var video = document.querySelector('#live');
    var canvas = document.querySelector('#canvas');
    var divCaras = document.querySelector('#carasActuales');
    var fps = 16;
    var noDetectadas = 0;
    var ctx = canvas.getContext('2d');
    var mainTimer;
    var caras = [];

    var debug = document.querySelector('#debug');
    var debugBtn = document.querySelector('#debugBtn');

    navigator.getMedia = (navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

    navigator.getMedia({ video: true, audio: false }, function(stream) {
      video.src = window.URL.createObjectURL(stream);
    }, function (err) { console.error(err); });

    debugBtn.onclick = function (e) {
      e.preventDefault();
      if (debugBtn.className != 'round alert') {
        debugBtn.innerHTML = 'Detener Debug';
        debugBtn.className = 'round alert';
        debug.style.display = 'block';
      } else {
        debug.style.display = 'none';
        debugBtn.className = 'round success';
        debugBtn.innerHTML = 'Iniciar Debug';
      }
    }

    var socket = io.connect(top.location.origin); // 'http://localhost');
    socket.on('caras', function (_caras) {
      // console.log(_caras)
      if (!_caras || _caras.length === 0) {
        if (++noDetectadas > 10) {
          noDetectadas = 0;
          caras = [];
        }
        return;
      }
      caras = _caras;
      if (debugBtn.className == 'round alert') {
        debug.innerHTML = JSON.stringify({fps:fps, caras: { total: caras.length, data: caras}});
      }
      //// Intenta Quitar el tembeleque
      // caras = _caras.map(function (cara) {
      //   cara.x = Math.floor(cara.x / 10) * 10;
      //   cara.y = Math.floor(cara.y / 10) * 10;
      //   cara.width = Math.floor(cara.width / 20) * 20;
      //   cara.height = Math.floor(cara.height / 20) * 20;
      //   return cara;
      // });
    }).on('disconnect', function (data) {
      console.log("Disconnected!!!", data);
    });

    function captura () {      
      mainTimer = setInterval(function () {
        ctx.drawImage(video, 0, 0, 320, 240);
        if (caras && caras.length) {
          divCaras.innerHTML = '';
          for (var i in caras) {
            var cara = caras[i];
            var _cara = document.createElement('canvas');
            // Fotica por individuo
            divCaras.appendChild(_cara);
            _cara.width = 64;
            _cara.height = 64;
            _cara.getContext('2d').drawImage(canvas, cara.x, cara.y, cara.width, cara.height, 0, 0, 64, 64);

            // Marco de Cara
            ctx.beginPath();
            ctx.rect(cara.x, cara.y, cara.width, cara.height);
            ctx.fillStyle = 'rgba(46, 166, 203, 0.5)';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#2ba6cb';
            ctx.stroke();
            // Marco de ojos
            if (cara.ojos) {
              for (var ojo in cara.ojos) {
                ojo = cara.ojos[ojo];
                ctx.beginPath();
                ctx.rect(ojo.x, ojo.y, ojo.width, ojo.height);
                ctx.fillStyle = 'transparent';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            }
          }
        }
        socket.emit('frame', canvas.toDataURL("image/jpeg"));
      }, 1000 / fps);
    }
    captura();