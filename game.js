const AssemblyJS = require('./AssemblyJS');
const engine = new AssemblyJS();

class Player extends engine.GameObject {
	constructor() {
		super([engine.Transform, engine.BoxCollider]);

		this.on('collisionEnter', collision => {
			console.log('test');
		});
	}
}

engine.on('start', game => {
	game.emit('newObject', new Player({ tag: 'stan' }));

	game.on('update', () => {});
});

engine.emit('newGame', { id: 'test', tickrate: 15 });
