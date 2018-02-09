const { resolve, join } = require('path');
const { Collection } = require('discord.js');
const fs = require('fs-nextra');
const Comando = require('./Comando');

class CarpetaComando extends Collection {

    constructor(client) {
        super();
        this.client = client;
        this.coreDir = join(this.client.coreBaseDir, 'comandos');
        this.userDir = join(this.client.clientBaseDir, 'comandos');
    }

    get ayuda() {
        return this.map(comando => ({ name: comando.nombre, usage: comando.usoCompilado.fullUsage, description : comando.descripcion }));
    }

    get(name) {
		return super.get(name) || this.aliases.get(name);
	}

	has(name) {
		return super.has(name) || this.aliases.has(name);
    }
    
    set(comando) {
		if (!(comando instanceof Comando)) return this.client.emit('error', 'Only commands may be stored in the CommandStore.');
		const existing = this.get(comando.nombre);
		if (existing) existing.delete();
		super.set(comando.ayuda.nombre, comando);
		return command;
	}

	delete(name) {
		const comando = this.resolve(name);
		if (!comando) return false;
		super.delete(comando.ayuda.nombre);
		return true;
    }
    
    clear() {
		super.clear();
	}

	init() {
		return Promise.all(this.map(piece => piece.init()));
	}

	resolve(name) {
		if (name instanceof Comando) return name;
		return this.get(name);
	}

	load(dir, file) {
		const cmd = this.set(new (require(join(dir, ...file)))(this.client, dir, file));
		delete require.cache[join(dir, ...file)];
		return cmd;
	}

	async loadAll() {
		this.clear();
		await CarpetaComando.walk(this, this.coreDir);
		await CarpetaComando.walk(this, this.userDir);
		return [this.size, 0];
    }
    
    static async walk(store, dir) {
		const files = await fs.readdir(dir).catch(() => { fs.ensureDir(dir).catch(err => store.client.emit('errorlog', err)); });
		if (!files) return false;
		files.filter(file => file.endsWith('.js')).map(file => store.load([file]));
		const subfolders = [];
		const mps1 = files.filter(file => !file.includes('.')).map(async (folder) => {
			const subFiles = await fs.readdir(resolve(dir, folder));
			if (!subFiles) return true;
			subFiles.filter(file => !file.includes('.')).forEach(subfolder => subfolders.push({ folder: folder, subfolder: subfolder }));
			return subFiles.filter(file => file.endsWith('.js')).map(file => store.load([folder, file]));
		});
		await Promise.all(mps1).catch(err => { throw err; });
		const mps2 = subfolders.map(async (subfolder) => {
			const subSubFiles = await fs.readdir(resolve(dir, subfolder.folder, subfolder.subfolder));
			if (!subSubFiles) return true;
			return subSubFiles.filter(file => file.endsWith('.js')).map(file => store.load([subfolder.folder, subfolder.subfolder, file]));
		});
		return Promise.all(mps2).catch(err => { throw err; });
	}

}

module.exports = CarpetaComando;