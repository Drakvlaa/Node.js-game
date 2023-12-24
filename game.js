const AssemblyJS = require('./AssemblyJS');
const engine = new AssemblyJS();

class Player extends engine.GameObject {
	constructor({ tag }) {
		super([engine.Transform, engine.BoxCollider]);

		this.gameObject.tag = tag;

		this.on('collisionEnter', collision => {
			console.log(this.gameObject.tag, collision.gameObject.tag);
		});
	}
}

engine.on('start', game => {
	game.emit('newObject', new Player({ tag: 'stan' }));
	game.emit('newObject', new Player({ tag: 'alex' }));

	game.allObjects[0].transform.scale.x = 50;
	game.allObjects[0].transform.velocity.x = 1;

	game.allObjects[1].transform.position.x = 100;
	game.allObjects[1].transform.scale.x = 50;

	game.on('update', () => {});
});

engine.emit('newGame', { id: 'test', tickrate: 15 });
