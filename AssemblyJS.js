class Emitter {
	constructor() {
		this.events = {};
	}

	on(eventName, listener) {
		if (!this.events[eventName]) {
			this.events[eventName] = [];
		}

		this.events[eventName].push(listener);
	}

	emit(eventName, data) {
		if (this.events[eventName]) {
			this.events[eventName].forEach(listener => {
				listener(data);
			});
		}
	}

	off(eventName, listener) {
		if (this.events[eventName]) {
			this.events[eventName] = this.events[eventName].filter(
				existingListener => existingListener !== listener,
			);
		}
	}
}

class Controller {
	constructor() {
		this.classObjects = [];
	}

	GetClassObjects(name, game) {
		this.classObjects = [];
		for (let i = 0; i < game.allObjects.length; ++i) {
			if (game.allObjects[i].components[name]) this.classObjects.push(game.allObjects[i]);
		}
	}
}

class AssemblyJS extends Emitter {
	constructor() {
		super();
		this.games = [];

		this.GameObject = class GameObject extends Emitter {
			constructor(components) {
				super();
				this.gameObject = {
					tag: 'new gameObject',
				};
				this.game = {};

				this.components = components;

				for (const component of this.components) {
					const newComponent = new component();
					for (const prop in newComponent) {
						this[prop] = newComponent[prop];
					}
				}

				this.on('destroy', (object = this) => {
					this.game.allObjects.splice(this.game.allObjects.indexOf(object), 1);
				});
			}
		};

		this.Game = class Game extends Emitter {
			constructor({ id, tickrate }) {
				super();
				this.id = id;
				this.tickrate = tickrate;
				this.allObjects = [];

				this.interval = setInterval(() => {
					this.emit('update');
				}, this.tickrate);

				this.on('newObject', object => {
					this.allObjects.push(object);
					object.game = this;
				});
			}
		};

		this.Transform = class Transform {
			constructor() {
				this.transform = {
					position: {
						x: 0,
						y: 0,
					},
					scale: {
						x: 1,
						y: 1,
					},
					anchor: {
						x: 0,
						y: 0,
					},
					velocity: {
						x: 0,
						y: 0,
					},
				};
			}
		};

		this.BoxCollider = class BoxCollider {
			constructor() {
				this.boxCollider = {
					isTrigger: false,
				};
			}
		};

		this.BoxColliderController = class BoxColliderController extends Controller {
			constructor(game) {
				super();
				this.objectsInCollision = [];

				this.on('update', () => {
					this.GetClassObjects('BoxCollider', game);

					for (let i = 0; i < this.classObjects.length; ++i) {
						for (let j = i + 1; j < this.classObjects.length; ++j) {
							let index = containsArray(this.objectsInCollision, [
								this.classObjects[i],
								this.classObjects[j],
							]);
							if (CollisonAABB(this.classObjects[i].transform, this.classObjects[j].transform)) {
								if (index > -1) {
									this.classObjects[i].emit('collisionStay', this.classObjects[j]);
									this.classObjects[j].emit('collisionStay', this.classObjects[i]);
								} else {
									this.objectsInCollision.push([this.classObjects[i], this.classObjects[j]]);
									this.classObjects[i].emit('collisionEnter', this.classObjects[j]);
									this.classObjects[j].emit('collisionEnter', this.classObjects[i]);
								}
							} else {
								if (index > -1) {
									this.objectsInCollision.splice(index, 1);
									this.classObjects[i].emit('collisionExit', this.classObjects[j]);
									this.classObjects[j].emit('collisionExit', this.classObjects[i]);
								}
							}
						}
					}
				});
			}
		};

		this.on('newGame', data => {
			let game = new this.Game(data);
			this.games.push(game);

			this.emit('start', game);
		});
	}
}

const CollisonAABB = (obj1, obj2) => {
	return (
		obj1.position.x < obj2.position.x + obj2.scale.x * scale &&
		obj1.position.x + obj1.scale.x * scale > obj2.position.x &&
		obj1.position.y < obj2.position.y + obj2.scale.y * scale &&
		obj1.position.y + obj1.scale.y * scale > obj2.position.y
	);
};

const containsArray = (inside, array) => {
	for (let i = 0; i < inside.length; ++i) {
		if (
			(array[0] == inside[i][0] && array[1] == inside[i][1]) ||
			(array[1] == inside[i][0] && array[0] == inside[i][1])
		) {
			return i;
		}
	}
	return -1;
};

module.exports = AssemblyJS;
