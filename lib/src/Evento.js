class Evento {

    constructor(client, dir, file, nombre) {
        this.client = client;
        this.dir = dir;
        this.file;
        this.nombre = nombre;
        this.type = 'evento';
    }

    async reload() {
        const evt = this.client.eventos.load(this.dir, this.file);
        evt.init();
        return evt;
    }

    run() {

    }

    init() {
        
    }

};

module.exports = Evento;