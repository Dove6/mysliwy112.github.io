const onLoadMain = async () => {
    Index.loadIndex();
    ANN.initCanvas();
    var params = new URLSearchParams(window.location.search);
    if (params.get('file') != undefined) {
        await ANN.initAnn(params.get('file'));
        if (params.get('event') != undefined) {
            ANN.changeEvent(params.get('event'));
        }
    }
};

onLoadMain();
