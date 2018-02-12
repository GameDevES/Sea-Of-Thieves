const Evento = require('../lib/src/Evento');
const now = require('performance-now');

module.exports = class extends Evento {

	constructor(...args) {
		super(...args, 'message');
	}

	async run(msg) {
		this.client.emit('log', "Hola");
	}

};