module.exports = class Proveedor {

    constructor(client, dir, file, nombre) {
        this.client = client;
        this.dir = dir;
        this.file = file;
        this.nombre = nombre;
        this.type = 'proveedor';
    }

    async reload() {
        const prov = this.client.proveedores.load(this.dir, this.file);
        prov.init();
        return prov;
    }

    run() {

    }

    init() {
        
    }

}