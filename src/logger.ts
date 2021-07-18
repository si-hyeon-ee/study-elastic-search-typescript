import moment from 'moment';

const now = () => moment().format('YYYY-MM-DD hh:mm:ss a');

type Prefix = 'LOG' | 'WARN' | 'ERROR';

const print = ({ payload, text, prefix }: { payload?: any; text?: string; prefix: Prefix }) => {
	let body = `[${now()}] : ${prefix} : `;
	if (text) {
		body += text;
	}
	if (payload !== undefined) {
		body += ` : [${JSON.stringify(payload)}]`;
	}
	console.log(body);
};

export const log = (text?: string, payload?: any) => {
	print({ prefix: 'LOG', payload, text });
};

export const warn = (text?: string, payload?: any) => {
	print({ prefix: 'WARN', text, payload });
};

export const error = (text?: string, payload?: any) => {
	print({ prefix: 'ERROR', text, payload });
};

export default { log, warn, error };
