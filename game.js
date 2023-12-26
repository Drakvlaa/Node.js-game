const AssemblyJS = require('./AssemblyJS');
const engine = new AssemblyJS();

class Player extends engine.GameObject {
	constructor({ tag, id, tid }) {
		super([engine.Transform, engine.BoxCollider], id || tid);

		this.gameObject.tag = tag || tid;
		this.keys = [];

		this.on('collisionStay', collision => {
			//console.log(this.gameObject.tag, collision.gameObject.tag);
		});
	}
}

engine.on('start', game => {
	game.emit('newObject', new Player({ tid: 'stan' }));
	game.emit('newObject', new Player({ tid: 'alex' }));

	game.on('update', () => {
		console.log(game.allObjects.keys());
	});
});

engine.emit('newGame', { id: 'test', tickrate: 15 });
