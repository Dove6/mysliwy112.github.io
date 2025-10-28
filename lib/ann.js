var ANN = (() => {
    let playing = 0;
    let time = 0;
    //framerate
    let frameTime = 62;

    //URLSearchParams
    let params;

    //active event
    let eve;
    //active frame
    let frame = 0;

    //active ann
    let pAnn;

    //loads events to events list
    function loadEventsList(ann) {
        var eventsList = document.getElementById('events');
        while (eventsList.firstChild) {
            eventsList.removeChild(eventsList.firstChild);
        }
        for (var ev of Object.keys(ann.events)) {
            var el = document.createElement('li');
            el.innerText = ev;
            el.addEventListener('click', ({ target }) => changeEvent(ann, target.innerText));
            el.classList.add('clickable');
            eventsList.appendChild(el);
        }
    }

    //main display canvas configuration
    function initCanvas(ann) {
        canvas = document.getElementById('screen');
        resizeCanvas(ann, document.getElementById('canvasWidth').value, document.getElementById('canvasHeight').value);
    }

    async function loadAnn(fullPath) {
        if (!fullPath) {
            return;
        }
        if (fullPath.endsWith('/')) {
            fullPath = fullPath.substr(0, fullPath.length - 1);
        }
        if (fullPath.toLowerCase().endsWith('.ann')) {
            fullPath = fullPath.substr(0, fullPath.length - 4);
        }

        const annFilename = fullPath.slice(fullPath.lastIndexOf('/') + 1);
        setParam('file', fullPath);
        const fetchDir = `/filesys/${fullPath}`;
        const jsonFullPath = `${fetchDir}/${annFilename}.json`;

        console.log(`Fetching ${jsonFullPath}`);
        const { images, events } = await (await fetch(jsonFullPath)).json();

        await Promise.all(Object.keys(images).map(filename => new Promise((resolve) => {
            images[filename].data = new Image();
            images[filename].data.onload = resolve;
            images[filename].data.src = `${fetchDir}/${filename}`;
        })));

        const ann = {
            name: annFilename,
            images,
            events,
        };

        loadEventsList(ann);
        changeEvent(ann, eve);

        pAnn = ann;
    }

    //sets URL parameters
    function setParam(name, value) {
        if (params == undefined) params = new URLSearchParams();
        params.set(name, value);
        let stateObj = { id: '100' };
        window.history.pushState(stateObj, name, '?' + params);
    }

    //playing manager
    function pl(ann, timestamp) {
        if (time == 0) time = timestamp;
        elapsed = timestamp - time;
        if (playing != 0) {
            if (elapsed > frameTime) {
                time = timestamp;
                if (changeFrame(ann, frame + playing)) {
                    pause();
                }
            }
            requestAnimationFrame(t => pl(ann, t));
        } else {
            time = 0;
        }
    }

    function play(ann) {
        playing = 1;
        requestAnimationFrame(t => pl(ann, t));
    }

    function playB(ann) {
        playing = -1;
        requestAnimationFrame(t => pl(ann, t));
    }

    function pause() {
        playing = 0;
    }

    //changes frame displayed on canvas
    function changeFrame(ann, frameIndex, clearCanvas = true) {
        if (clearCanvas) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
        var end = 0;
        if (ann.events[eve].frames.length > 0) {
            if (frameIndex != undefined) {
                if (document.getElementById('loopCheck').checked == 0) {
                    if (ann.events[eve].frames.length <= frameIndex) {
                        frameIndex = ann.events[eve].frames.length - 1;
                        end = 1;
                    } else if (frameIndex < 0) {
                        frameIndex = 0;
                        end = 1;
                    }
                } else if (ann.events[eve].frames.length <= frameIndex) {
                    frameIndex = 0;
                } else if (frameIndex < 0) {
                    frameIndex = ann.events[eve].frames.length - 1;
                }
                frame = frameIndex;
            }

            var frm = ann.events[eve].frames[frame];

            if ('filename' in frm) {
                var img = ann.images[frm.filename];
                drawFrame(canvas, img, frm);
            }
        } else {
            end = 1;
        }
        return end;
    }

    function changeEvent(ann, eventName, resetFrame = true) {
        if (!(eventName in ann.events)) {
            eventName = Object.keys(ann.events)[0];
        }

        setParam('event', eventName);
        var eventsList = document.getElementById('events');
        for (child of eventsList.children) {
            if (child.innerHTML == eventName) {
                child.classList.add('selected');
            } else {
                child.classList.remove('selected');
            }
        }

        eve = eventName;
        f = document.getElementById('frames');
        document.getElementById('loopCheck').checked = ann.events[eve].loop > 0;
        var i = 0;

        while (f.firstChild) {
            f.removeChild(f.firstChild);
        }

        for (i = 0; i < ann.events[eve].frames.length; i++) {
            if ('filename' in ann.events[eve].frames[i]) {
                f.appendChild(document.createElement('img'));
                f.lastElementChild.src = ann.images[ann.events[eve].frames[i].filename].data.src;
                f.lastElementChild.dataset.frame = i;
                f.lastElementChild.addEventListener('click', function () {
                    changeFrame(ann, Number(this.dataset.frame));
                });
            }
        }
        if (resetFrame) {
            pause();
            changeFrame(ann, 0);
        }
    }

    function drawMultipleFrames(ann, frames = undefined, clear = true) {
        if (clear) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
        if (frames == undefined) {
            frames = Array.from(Array(ann.events[eve].frames.length).keys());
        }
        for (frame of frames) {
            if (ann.events[eve].frames.length > frame && frame >= 0) {
                var frm = ann.events[eve].frames[frame];
                drawFrame(canvas, ann.images[frm.filename], frm);
            }
        }
    }

    function drawMultipleEvents(ann) {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        events = Object.keys(ann.events);
        for (ev of events) {
            changeEvent(ann, ev, false);
            drawMultipleFrames(ann, undefined, false);
        }
    }

    function drawFrame(drawer, img, frm = undefined, cX = 0, cY = 0) {
        if (frm == undefined) frm = {};
        var ctx = drawer.getContext('2d');
        if (img.position_x == undefined) img.position_x = 0;
        if (img.position_y == undefined) img.position_y = 0;
        if (frm.position_x == undefined) frm.position_x = 0;
        if (frm.position_y == undefined) frm.position_y = 0;
        var posX = img.position_x + frm.position_x + cX;
        var posY = img.position_y + frm.position_y + cY;
        if (document.getElementById('centerCheck').checked) {
            posX = canvas.width / 2 + posX;
            posY = canvas.height / 2 + posY;
        }
        ctx.drawImage(img.data, posX, posY);
    }

    function resizeCanvas(ann, width = null, height = null) {
        if (width != null) {
            canvas.width = width;
        }
        if (height != null) {
            canvas.height = height;
        }
        if (ann) {
            changeFrame(ann);
        }
    }

    //incomplete saving functions

    function saveGif(ann) {
        var encoder = new GIFEncoder();
        encoder.setRepeat(!document.getElementById('loopCheck').checked);
        encoder.setDelay(frameTime);

        var drawer = document.createElement('canvas');
        drawer.width = canvas.width;
        drawer.height = canvas.height;
        drawer.getContext('2d').fillStyle = '#fc02db';

        // encoder.setTransparent(0xfc02db);
        encoder.start();
        for (fr of ann.events[eve].frames) {
            drawer.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            // drawer.getContext('2d').fillRect(0, 0, canvas.width, canvas.height);
            drawFrame(drawer, ann.images[fr.filename], fr);
            encoder.addFrame(drawer.getContext('2d'));
        }
        encoder.finish();
        encoder.download(ann.name + '.gif');
    }

    function saveSequence(ann) {
        drawer.width = canvas.width;
        drawer.height = canvas.height;
        var i = 0;
        for (fr of ann.events[eve].frames) {
            drawFrame(drawer, ann.images[fr.filename], fr);
            var dataURL = drawer.toDataURL();
            zip.file(eve + '_' + i, dataURL.split('base64,')[1], { base64: true });
            i++;
        }

        zip
            .generateAsync({ type: 'blob' })
            // zip.generateAsync({type:"base64"})
            .then(function (content) {
                // see FileSaver.js
                saveAs(content, ann.name + '_' + eve + '.zip');
                // window.location = "data:application/zip;base64," + content;
            });
    }

    function saveAnn(ann) {
        throw new Error('Not implemented');
    }

    function saveFiles(ann) {
        var zip = new JSZip();

        var drawer = document.createElement('canvas');
        drawer.width = canvas.width;
        drawer.height = canvas.height;

        var i = 0;
        for (img of Object.keys(ann.images)) {
            drawFrame(drawer, ann.images[img]);
            var dataURL = drawer.toDataURL();
            zip.file(img, dataURL.split('base64,')[1], { base64: true });
            i++;
        }
        zip.file(name + '.json', JSON.stringify(ann, null, 2));
        zip.generateAsync({ type: 'blob' }).then(function (content) {
            saveAs(content, ann.name + '.zip');
        });
    }

    //special functions used for specific anns and purposes, can be launched only from console

    function drawArrows(ann, num) {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        events = Object.keys(ann.events);
        for (ev of events) {
            changeEvent(ann, ev, false);
            changeFrame(ann, num, false);
        }
    }

    function drawMap(ann, guide, addX, addY) {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        for (var i of Object.keys(guide.images)) {
            console.log(guide.images[i].name.slice(0, 2).toUpperCase());
            if (guide.images[i].name.slice(0, 2).toUpperCase() in ann.events) {
                drawFrame(
                    canvas,
                    ann.images[ann.events[guide.images[i].name.slice(0, 2).toUpperCase()].frames[0].filename],
                    undefined,
                    guide.images[i].position_x * 10 + addX * 10,
                    guide.images[i].position_y * 10 + addY * 10
                );
            }
        }
    }

    return {
        initCanvas: () => initCanvas(pAnn),
        resizeCanvas: (width = null, height = null) => resizeCanvas(pAnn, width, height),
        changeFrame: (frameIndex, clearCanvas = true) => changeFrame(pAnn, frameIndex, clearCanvas),
        changeEvent: (eventName, resetFrame = true) => changeEvent(pAnn, eventName, resetFrame),
        play: () => play(pAnn),
        playB: () => playB(pAnn),
        pause,
        drawMultipleFrames: (frames = undefined, clearCanvas = true) => drawMultipleFrames(pAnn, frames, clearCanvas),
        drawMultipleEvents: () => drawMultipleEvents(pAnn),
        saveGif: () => saveGif(pAnn),
        saveAnn: () => saveAnn(pAnn),
        saveSequence: () => saveSequence(pAnn),
        saveFiles: () => saveFiles(pAnn),
        initAnn: loadAnn,
        debug: {
            drawArrows: (num) => drawArrows(pAnn, num),
            drawMap: (guide, addX, addY) => drawMap(pAnn, guide, addX, addY),
        },
    };
})();
