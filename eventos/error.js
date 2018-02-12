const Evento = require('../lib/src/Evento');

module.exports = class extends Evento {

	constructor(...args) {
		super(...args, 'error');
	}

	run(err) {
		this.client.emit('log', err, 'error');
	}

};