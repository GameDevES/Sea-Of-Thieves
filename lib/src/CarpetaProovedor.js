const { join } = require('path');
const { Collection } = require('discord.js');
const fs = require('fs-nextra');
const Proveedor = require('./Proveedor');

module.exports = class CarpetaProveedor extends Collection {

    constructor(client) {
        super();
        this.client = client;
        this.coreDir = join(this.client.coreBaseDir, 'proveedores');
        this.userDir = join(this.client.clientBaseDir, 'proveedores');
    }

    set(proveedor) {
		if (!(proveedor instanceof Proveedor)) return this.client.emit('error', 'Only providers may be stored in the ProviderStore.');
		super.set(proveedor.name, proveedor);
		return proveedor;
	}

	init() {
		return Promise.all(this.map(piece => piece.init()));
	}

	resolve(name) {
		if (name instanceof Proveedor) return name;
		return this.get(name);
	}

	load(dir, file) {
		const prov = this.set(new (require(join(dir, file)))(this.client, dir, file));
		delete require.cache[join(dir, file)];
		return prov;
	}

	async loadAll() {
		this.clear();
		const coreFiles = await fs.readdir(this.coreDir).catch(() => { fs.ensureDir(this.coreDir).catch(err => this.client.emit('error', err)); });
		await Promise.all(coreFiles.map(this.load.bind(this, this.coreDir)));
		const userFiles = await fs.readdir(this.userDir).catch(() => { fs.ensureDir(this.userDir).catch(err => this.client.emit('error', err)); });
		await Promise.all(userFiles.map(this.load.bind(this, this.userDir)));
		return this.size;
	}

}