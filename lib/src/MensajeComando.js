class MensajeComando {

    constructor(msg, cmd, prefix, prefixLength) {
        Object.defineProperty(this, 'client', { value: msg.client });
        this.msg = msg;
        this.cmd = cmd;
        this.prefix = prefix;
        this.prefixLength = prefixLength;
        this.argumentos = this.constructor.getArgumentos(this);
        this.params = [];
        this.reprompted = false;
		this._currentUsage = {};
		this._repeat = false;
    }

    async validarArgumentos() {
        if (this.params.length >= this.cmd.uso.usoCompilado.length && this.params.length >= this.argumentos.length) {
            return this.params;
        } else if (this.cmd.uso.usoCompilado[this.params.length]) {
            if (this.cmd.uso.usoCompilado[this.params.length].type !== 'repeat') {
				this._currentUsage = this.cmd.uso.usoCompilado[this.params.length];
			} else if (this.cmd.uso.usoCompilado[this.params.length].type === 'repeat') {
				this._currentUsage.type = 'optional';
				this._repeat = true;
			}
        } else if (!this._repeat) {
			return this.params;
		}
		if (this._currentUsage.type === 'optional' && (this.argumentos[this.params.length] === undefined || this.argumentos[this.params.length] === '')) {
			if (this.cmd.uso.usoCompilado.slice(this.params.length).some(uso => uso.type === 'required')) {
				this.argumentos.splice(this.params.length, 0, undefined);
				this.argumentos.splice(this.params.length, 1, null);
				throw this.client.funcs.newError('Missing one or more required arguments after end of input.', 1);
			} else {
				return this.params;
			}
		} else if (this._currentUsage.type === 'required' && this.argumentos[this.params.length] === undefined) {
			this.argumentos.splice(this.params.length, 1, null);
			throw this.client.funcs.newError(this._currentUsage.possibles.length === 1 ?
				`${this._currentUsage.possibles[0].name} is a required argument.` :
				`Missing a required option: (${this._currentUsage.possibles.map(poss => poss.name).join(', ')})`, 1);
		} else if (this._currentUsage.possibles.length === 1) {
			if (this.client.argResolver[this._currentUsage.possibles[0].type]) {
				return this.client.argResolver[this._currentUsage.possibles[0].type](this.argumentos[this.params.length], this._currentUsage, 0, this._repeat, this.msg)
					.catch((err) => {
						this.argumentos.splice(this.params.length, 1, null);
						throw this.client.funcs.newError(err, 1);
					})
					.then((res) => {
						if (res !== null) {
							this.params.push(res);
							return this.validarArgumentos();
						}
						this.argumentos.splice(this.params.length, 0, undefined);
						this.params.push(undefined);
						return this.validarArgumentos();
					});
			}
			this.client.emit('log', 'Unknown Argument Type encountered', 'warn');
			return this.validarArgumentos();
		} else {
			return this.multiPossibles(0, false);
		}
    }

    async multiPossibles(possible, validated) {
		if (validated) {
			return this.validarArgumentos();
		} else if (possible >= this._currentUsage.possibles.length) {
			if (this._currentUsage.type === 'optional' && !this._repeat) {
				this.argumentos.splice(this.params.length, 0, undefined);
				this.params.push(undefined);
				return this.validarArgumentos();
			}
			this.argumentos.splice(this.params.length, 1, null);
			throw this.client.funcs.newError(`Your option didn't match any of the possibilities: (${this._currentUsage.possibles.map(poss => poss.name).join(', ')})`, 1);
		} else if (this.client.argResolver[this._currentUsage.possibles[possible].type]) {
			return this.client.argResolver[this._currentUsage.possibles[possible].type](this.argumentos[this.params.length], this._currentUsage, possible, this._repeat, this.msg)
				.then((res) => {
					if (res !== null) {
						this.params.push(res);
						return this.multiPossibles(++possible, true);
					}
					return this.multiPossibles(++possible, validated);
				})
				.catch(() => this.multiPossibles(++possible, validated));
		} else {
			this.client.emit('log', 'Unknown Argument Type encountered', 'warn');
			return this.multiPossibles(++possible, validated);
		}
	}


	static getArgumentos(cmdMsg) {
		const args = cmdMsg.msg.content.slice(cmdMsg.prefixLength).trim().split(' ').slice(1).join(' ');
		if (args === '') return [];
		return args;
	}

}

module.exports = MensajeComando;