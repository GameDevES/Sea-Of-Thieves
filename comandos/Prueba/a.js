const Comando = require('../../lib/src/Comando');

module.exports = class extends Comando {

	constructor(...args) {
		super(...args, 'a', {
			descripcion: 'Prueba.'
		});
	}

	async run(msg) {
		const informacion = "Prueba de comando";
		return msg.channel.send(informacion);
	}

};