const Discord = require('discord.js');
const path = require('path');
const now = require('performance-now');
const MensajeComando = require('./MensajeComando');
const ArgResolver = require('./argResolver');
const util = require('./Herramientas');
const EventStore = require('./CarpetaEventos');
const CommandStore = require('./CarpetaComando');

class SOT extends Discord.Client {

    constructor(config = {}) {
        if (typeof config !== 'object') throw new TypeError('Configuration for Klasa must be an object.');
        super(config.clientOptions);
		this.config = config;
		this.config.provider = config.provider || {};
		this.coreBaseDir = path.join(__dirname, '../');
		this.clientBaseDir = process.cwd();
        this.argResolver = new ArgResolver(this);
        this.comandos = new CommandStore(this);
        this.eventos = new EventStore(this);
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
        const [comandos, eventos] = await Promise.all([
            this.comandos.loadAll(),
            this.eventos.loadAll()
        ]).catch((err) => {
            console.error(err);
            process.exit();
        });

        super.login(token);
    }

    async _ready() {
		this.config.prefixMention = new RegExp(`^<@!?${this.user.id}>`);
		if (this.user.bot) this.application = await super.fetchApplication();
		if (!this.config.ownerID) this.config.ownerID = this.user.bot ? this.application.owner.id : this.user.id;
		await this.comandos.init();
        this.ready = true;
    }

};

process.on('unhandledRejection', (err) => {
	if (!err) return;
	console.error(`Uncaught Promise Error: \n${err.stack || err}`);
});

module.exports = SOT;