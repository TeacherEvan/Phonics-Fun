```javascript
class Planet {
	// ...existing code...

	triggerExplosion() {
		return new Promise(resolve => {
			this.playExplosionAnimation(resolve); // resolve when animation ends
			AudioManager.play("explosion");
		});
	}
}
```