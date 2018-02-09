const Uso = require('./Uso');

class Comando {

    constructor(client, dir, file, nombre, {
        NivelPermisos = 0,
        descripcion = '',
        uso = ''
    }) {
        this.client = client;
        this.conf = { NivelPermisos, descripcion, uso };
        this.ayuda = { nombre, descripcion, uso, Categoria: dir[0] || 'Predefinido', SubCategoria: dir[1] || 'Predefinido' };
        this.uso = new Uso(client, this);
        this.dir = dir;
    }

    async reload() {
        const cmd = this.client.comandos.load(this.dir, this.file);
        cmd.init();
        return cmd;
    }

    run() {

    }

    init() {

    }

}

module.exports = Comando;