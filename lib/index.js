class FileIndex {
    #filesys;

    constructor(parentElement, entries) {
        this.#filesys = document.createElement('ul');
        parentElement.appendChild(this.#filesys);

        //Loads index.json entries into directory tree
        for (const { path, name } of entries) {
            this.addEntry(path, name);
        }
    }

    // adds entry to directory tree: path to show in director tree / name of file / physical path to file - optional
    addEntry(filepath, filename, physicalpath) {
        if (physicalpath == undefined) {
            physicalpath = filepath + '/' + filename;
        }

        var path = filepath.split('/').filter((a) => a != '');
        var file = filename + '.ann';
        var child = this.createDir(this.#filesys, path, 0);
        var fileNode = document.createElement('li');
        fileNode.innerHTML = file;
        fileNode.dataset.path = physicalpath;
        fileNode.classList.add('clickable');
        fileNode.addEventListener('click', () => ANN.initAnn(fileNode.dataset.path));
        child.appendChild(fileNode);
    }

    // adds directory to directory tree: directory node / directory names in path / level in path
    createDir(node, path, p) {
        let child;

        for (const ch of node.children) {
            if (ch.children.length > 0 && ch.children[0].children[1].innerHTML == path[p]) {
                child = ch;
            }
        }

        if (child == undefined) {
            child = document.createElement('li');
            var dat = document.createElement('span');
            dat.addEventListener('click', () => {
                dat.parentElement.querySelector('.nested').classList.toggle('active');
                dat.children[0].classList.toggle('caret-down');
            });
            dat.classList.add('clickable');

            var caret = document.createElement('span');
            caret.classList.add('caret');

            var text = document.createElement('span');
            text.innerHTML = path[p];
            // text.classList.add("clickable");

            var ex = document.createElement('ul');
            ex.classList.add('nested');
            // ex.classList.add("clickable");

            dat.appendChild(caret);
            dat.appendChild(text);
            child.appendChild(dat);
            child.appendChild(ex);
            node.appendChild(child);
        }

        if (path.length > p + 1) {
            return this.createDir(child.children[1], path, p + 1);
        } else {
            return child.children[1];
        }
    }
}
