const { nanoid } = require('nanoid');

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

class Controller extends Emitter {
	constructor() {
		super();
		this.classObjects = [];
	}

	GetClassObjects(name, game) {
		this.classObjects = [];
		for (const object of game.allObjects.values()) {
			if (object[name]) this.classObjects.push(object);
		}
	}
}

class AssemblyJS extends Emitter {
	constructor() {
		super();
		this.games = [];

		this.GameObject = class GameObject extends Emitter {
			constructor(components, id) {
				super();
				this.gameObject = {
					tag: 'new gameObject',
					id: id || nanoid(),
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
					this.game.allObjects.delete(object.id);
				});
			}
		};

		this.Game = class Game extends Emitter {
			constructor({ id, tickrate }) {
				super();
				this.id = id;
				this.tickrate = tickrate;
				this.allObjects = new Map();

				this.controllers = [new BoxColliderController(), new TransformController()];

				this.interval = setInterval(() => {
					this.emit('update');
				}, this.tickrate);

				this.on('update', () => {
					for (const controller of this.controllers) {
						controller.emit('update', this);
					}
				});
				/*
				this.on('addData', data => {
					for (const prop in data) {
						if (typeof data[prop] != 'object') {
							this[prop] = data[prop];
						} else if (!this[prop]) {
							this[prop] = data[prop];
						} else if (Array.isArray(data[prop])) {
							this[prop] = this[prop].concat(data[prop]);
						} else {
							Object.assign(this[prop], data[prop]);
						}
					}
				});
				*/
				this.on('newObject', object => {
					this.allObjects.set(object.gameObject.id, object);
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

		class BoxColliderController extends Controller {
			constructor() {
				super();
				this.objectsInCollision = [];

				this.on('update', game => {
					if (!game) return;

					this.GetClassObjects('boxCollider', game);

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
		}

		class TransformController extends Controller {
			constructor() {
				super();

				this.on('update', game => {
					if (!game) return;

					this.GetClassObjects('transform', game);
					for (const object of this.classObjects) {
						object.transform.position.x += object.transform.velocity.x;
						object.transform.position.y += object.transform.velocity.y;
					}
				});
			}
		}

		const CollisonAABB = (obj1, obj2) => {
			return (
				obj1.position.x < obj2.position.x + obj2.scale.x &&
				obj1.position.x + obj1.scale.x > obj2.position.x &&
				obj1.position.y < obj2.position.y + obj2.scale.y &&
				obj1.position.y + obj1.scale.y > obj2.position.y
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

		this.on('newGame', data => {
			let game = new this.Game(data);
			this.games.push(game);

			this.emit('start', game);
		});
	}
}

module.exports = AssemblyJS;
