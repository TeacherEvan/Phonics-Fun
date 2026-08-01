# Asteroid Class

This file contains the definition of the `Asteroid` class, which is responsible for managing asteroid objects in the Phonics Fun game.

## Class Definition

```javascript
class Asteroid {
	constructor() {
		// ...existing constructor code...
	}

	// ...existing methods...

	triggerExplosion() {
		return new Promise(resolve => {
			this.playExplosionAnimation(resolve);
			AudioManager.play("explosion");
		});
	}
}
```

## Method: `triggerExplosion()`

- **Description**: This method is called to trigger the explosion of an asteroid. It plays the explosion animation and sound.
- **Returns**: A promise that resolves when the animation is complete.

## Usage

To use the `Asteroid` class, you need to create an instance of it and call its methods as required by the game logic. For example, to trigger an explosion for an asteroid instance, you would do the following:

```javascript
let asteroid = new Asteroid();
asteroid.triggerExplosion().then(() => {
	// Code to execute after the explosion animation is complete
});
```

## Notes

- Ensure that the `AudioManager` is properly configured to play the explosion sound.
- The `playExplosionAnimation` method must be defined for the explosion animation to work.