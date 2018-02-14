const Discord = require('discord.js');
const path = require('path');
const now = require('performance-now');
const MensajeComando = require('./MensajeComando');
const ArgResolver = require('./argResolver');
const util = require('./Herramientas');
const EventStore = require('./CarpetaEventos');
const CarpetaComando = require('./CarpetaComando');
const CarpetaProveedor = require('./CarpetaProovedor');

class SOT extends Discord.Client {

    constructor(config = {}) {
        if (typeof config !== 'object') throw new TypeError('Configuration for Klasa must be an object.');
        super(config.clientOptions);
		this.config = config;
		this.config.provider = config.provider || {};
		this.coreBaseDir = path.join(__dirname, '../');
		this.clientBaseDir = process.cwd();
        this.argResolver = new ArgResolver(this);
        this.comandos = new CarpetaComando(this);
        this.eventos = new EventStore(this);
        this.proveedores = new CarpetaProveedor(this);
        this.commandMessages = new Discord.Collection();
        this.commandMessageLifetime = config.commandMessageLifetime || 1800;
		this.commandMessageSweep = config.commandMessageSweep || 900;
        this.ready = false;
        this.methods = {
			Collection: Discord.Collection,
			Embed: Discord.MessageEmbed,
			MessageCollector: Discord.MessageCollector,
			Webhook: Discord.WebhookClient,
			escapeMarkdown: Discord.escapeMarkdown,
			splitMessage: Discord.splitMessage,
			MensajeComando,
			util
        };
        this.application = null;
		this.once('ready', this._ready.bind(this));
    }

    async login(token) {
        const start = now();
        const [comandos, eventos, proveedores] = await Promise.all([
            this.comandos.loadAll(),
            this.eventos.loadAll(),
            this.proveedores.loadAll()
        ]).catch((err) => {
            console.error(err);
            process.exit();
        });
        this.emit('log', [
			`Cargado ${comandos} comandos`,
			`Cargado ${proveedores} proveedores.`,
			`Cargado ${eventos} eventos.`,
		].join('\n'));

        this.emit('log', `Cargado en ${(now() - start).toFixed(2)}ms.`);
        super.login(token);
    }

    async _ready() {
		this.config.prefixMention = new RegExp(`^<@!?${this.user.id}>`);
		if (this.user.bot) this.application = await super.fetchApplication();
		if (!this.config.ownerID) this.config.ownerID = this.user.bot ? this.application.owner.id : this.user.id;
        await this.comandos.init();
        this.proveedores.init();
        this.ready = true;
        this.emit('log', this.config.readyMessage || `Iniciado correctamente. Listo para trabajar en ${this.guilds.size} servidores`);
    }

};

process.on('unhandledRejection', (err) => {
	if (!err) return;
	console.error(`Uncaught Promise Error: \n${err.stack || err}`);
});

module.exports = SOT;