const Application = PIXI.Application;
const Graphichs = PIXI.Graphichs;

const app = new Application({
	width: 320,
	height: 180,
	backgroundColor: 0x1094d2,
	antialias: true,
});

app.renderer.view.style.imageRendering = 'pixelated';

document.body.appendChild(app.view);

//const testTexture = PIXI.Texture.from('./test.png');
//const testSprite = new PIXI.Sprite(testTexture);
const container = new PIXI.Container();

const testSprite = PIXI.Sprite.from('./test.png');
container.addChild(testSprite);
testSprite.anchor.set(0.5, 0.5);
testSprite.position.set(100, 100);

const testSprite2 = PIXI.Sprite.from('./test.png');
container.addChild(testSprite2);
testSprite2.anchor.set(0.5, 0.5);
testSprite2.position.set(200, 100);

app.stage.addChild(container);

const particleContainer = new PIXI.ParticleContainer(1000, {
	position: true,
	rotation: true,
	vertices: true,
	tint: true,
	uvs: true,
});

const updateSize = () => {
	app.renderer.view.style.position = 'absolute';
	if (innerHeight > (innerWidth / 320) * 180) {
		app.renderer.view.style.width = '100%';
		app.renderer.view.style.height = 'auto';
	} else {
		app.renderer.view.style.width = 'auto';
		app.renderer.view.style.height = '100%';
	}
};

app.ticker.add(delta => loop(delta));

function loop(delta) {
	updateSize();
	//testSprite.x += 1;
	testSprite.rotation += 0.01;
}

testSprite2.interactive = true;

testSprite2.on('pointerdown', () => {
	testSprite2.x += 1;
});

document.addEventListener('keydown', e => {
	switch (e.code) {
		case 'KeyA':
			container.x -= 1;
			break;
		case 'KeyD':
			container.x += 1;
			break;
		case 'KeyW':
			container.y -= 1;
			break;
		case 'KeyS':
			container.y += 1;
			break;
	}
});
