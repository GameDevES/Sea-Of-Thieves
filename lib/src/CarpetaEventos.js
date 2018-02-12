const { join } = require('path');
const { Collection } = require('discord.js');
const fs = require('fs-nextra');
const Evento = require('./Evento');

class CarpetaEventos extends Collection {

    constructor(client) {
		super();
		this.client = client;
		this.coreDir = join(this.client.coreBaseDir, 'eventos');
		this.userDir = join(this.client.clientBaseDir, 'eventos');
	};

	set(event) {
		if (!(event instanceof Evento)) return this.client.emit('error', 'Only events may be stored in the EventStore.');
		const existing = this.get(event.nombre);
		if (existing) existing.delete();
		this.client.on(event.nombre, event.run.bind(event));
		super.set(event.nombre, event);
		return event;
	};

	delete(name) {
		const event = this.resolve(name);
		if (!event) return false;
		this.client.removeAllListeners(event.nombre);
		super.delete(event.nombre);
		return true;
	};

	clear() {
		this.forEach((val, key) => this.delete(key));
	};

	init() {
		return Promise.all(this.map(piece => piece.init()));
	};

	resolve(name) {
		if (name instanceof Evento) return name;
		return this.get(name);
	};

	load(dir, file) {
		const evt = this.set(new (require(join(dir, file)))(this.client, dir, file));
		delete require.cache[join(dir, file)];
		return evt;
	};

	async loadAll() {
		this.clear();
		const coreFiles = await fs.readdir(this.coreDir).catch(() => { fs.ensureDir(this.coreDir).catch(err => this.client.emit('error', err)); });
		await Promise.all(coreFiles.map(this.load.bind(this, this.coreDir)));
		const userFiles = await fs.readdir(this.userDir).catch(() => { fs.ensureDir(this.userDir).catch(err => this.client.emit('error', err)); });
		await Promise.all(userFiles.map(this.load.bind(this, this.userDir)));
		return this.size;
    };
    
};

module.exports = CarpetaEventos;