
class Uso {

    constructor(client, comando) {
        Object.defineProperty(this, 'client', { value: client });
        this.nombre = comando.ayuda.nombre;
        this.comandos = this.nombre;
        this.stringUso = comando.ayuda.uso;
        this.usoCompilado = this.usoCompilado();
        this.casiUsoCompleto = `${this.comandos}${comando.ayuda.uso !== '' ? comando.ayuda.uso.split(' ') : ''}`;
    }

    usoCompleto(msg) {
        const prefix = "%";
        return `${prefix.length !== 1 ? `${prefix} ` : prefix}${this.casiUsoCompleto}`;
    }

    usoCompilado() {
        let uso = {
            tags: [],
            opened: 0,
            current: '',
            openReq: false,
            last: false,
            char: 0,
            from: 0,
            at: '',
            fromto: ''
        };

        this.stringUso.split('').forEach((com, i) => {
			uso.char = i + 1;
			uso.from = uso.char - uso.current.length;
			uso.at = `en caracter #${uso.char} '${com}'`;
			uso.fromto = `desde caracter #${uso.from} to #${uso.char} '${uso.current}'`;

			if (uso.last && com !== ' ') {
				throw `${uso.at}: .`;
			}

			if (this[com]) {
				uso = this[com](uso);
			} else {
				uso.current += com;
			}
        });
        
        if (uso.opened) throw `from char #${this.stringUso.length - uso.current.length} '${this.stringUso.substr(-uso.current.length - 1)}' to end: a tag was left open`;
		if (uso.current) throw `from char #${(this.stringUso.length + 1) - uso.current.length} to end '${uso.current}' a literal was found outside a tag.`;

		return uso.tags;
    }

    ['<'](uso) {
		if (uso.opened) throw `${uso.at}: you might not open a tag inside another tag.`;
		if (uso.current) throw `${uso.fromto}: there can't be a literal outside a tag`;
		uso.opened++;
		uso.openReq = true;
		return uso;
	}

	['>'](uso) {
		if (!uso.opened) throw `${uso.at}: invalid close tag found`;
		if (!uso.openReq) throw `${uso.at}: Invalid closure of '[${uso.current}' with '>'`;
		uso.opened--;
		if (uso.current) {
			uso.tags.push({
				type: 'required',
				possibles: this.parseTag(uso.current, uso.tags.length + 1)
			});
			uso.current = '';
		} else { throw `${uso.at}: empty tag found`; }
		return uso;
	}

	['['](uso) {
		if (uso.opened) throw `${uso.at}: you might not open a tag inside another tag.`;
		if (uso.current) throw `${uso.fromto}: there can't be a literal outside a tag`;
		uso.opened++;
		uso.openReq = false;
		return uso;
	}

	[']'](uso) {
		if (!uso.opened) throw `${uso.at}: invalid close tag found`;
		if (uso.openReq) throw `${uso.at}: Invalid closure of '<${uso.current}' with ']'`;
		uso.opened--;
		if (uso.current === '...') {
			if (uso.tags.length < 1) { throw `${uso.fromto}: there can't be a loop at the begining`; }
			uso.tags.push({ type: 'repeat' });
			uso.last = true;
			uso.current = '';
		} else if (uso.current) {
			uso.tags.push({
				type: 'optional',
				possibles: this.parseTag(uso.current, uso.tags.length + 1)
			});
			uso.current = '';
		} else { throw `${uso.at}: empty tag found`; }
		return uso;
	}

	[' '](uso) {
		if (uso.opened) throw `${uso.at}: spaces aren't allowed inside a tag`;
		if (uso.current) throw `${uso.fromto}: there can't be a literal outside a tag.`;
		return uso;
	}

	['\n'](uso) {
		throw `${uso.at}: there can't be a line break in the command!`;
    }
    
    parseTag(tag, count) {
		const literals = [];
		const types = [];
		const toRet = [];

		const members = tag.split('|');

		members.forEach((elemet, i) => {
			const current = `at tag #${count} at bound #${i + 1}`;

			const result = /^([^:]+)(?::([^{}]+))?(?:{([^,]+)?(?:,(.+))?})?$/i.exec(elemet);

			if (!result) throw `${current}: invalid syntax, non specific`;

			const fill = {
				name: result[1],
				type: result[2] ? result[2].toLowerCase() : 'literal'
			};

			if (result[3]) {
				const proto = ' in the type length (min): ';

				if (fill.type === 'literal') throw `${current + proto}you cannot set a length for a literal type`;

				if (isNaN(result[3])) throw `${current + proto}must be a number`;

				const temp = parseFloat(result[3]);
				if ((fill.type === 'string' || fill.type === 'str') && temp % 1 !== 0) throw `${current + proto}the string type must have an integer length`;

				fill.min = temp;
			}

			if (result[4]) {
				const proto = ' in the type length (max): ';
				if (fill.type === 'literal') throw `${current + proto}you canno't set a length for a literal type`;

				if (isNaN(result[4])) throw `${current + proto}must be a number`;

				const temp = parseFloat(result[4]);

				if ((fill.type === 'string' || fill.type === 'str') && temp % 1 !== 0) throw `${current + proto}the string type must have an integer length`;
				fill.max = temp;
			}

			if (fill.type === 'literal') {
				if (literals.includes(fill.name)) throw `${current}: there can't be two literals with the same text.`;

				literals.push(fill.name);
			} else if (members.length > 1) {
				if (fill.type === 'string' && members.length - 1 !== i) throw `${current}: the String type is vague, you must specify it at the last bound`;
				if (types.includes(fill.type)) throw `${current}: there can't be two bounds with the same type (${fill.type})`;
				types.push(fill.type);
			}

			toRet.push(fill);
		});

		return toRet;
	}

}

module.exports = Uso;