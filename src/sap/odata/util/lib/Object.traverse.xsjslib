(function() {
	if(!Object.prototype.traverse) {
		/**
		 * Traverses this object recursively and calls the specified visitor.
		 * 
		 * Traversal is preorder.
		 * 
		 * <pre><code>function visitor(currentObject, parentObject?, name?)</code></pre>
		 * currentObject: Current object
		 * parent: Parent object
		 * name: Property name under which currentObject is found in parent, iff parent is an Object
		 * 
		 */
		Object.prototype.traverse = function(visitor, parent, name) {
			if(!visitor) return;
			
			visitor(this, parent, name);
			
			this.eachValue(function(value, key) {
				var value = this[key];
				if(value instanceof Array ||
						value && typeof value === 'object') value.traverse(visitor, this, key);
				else visitor(value, this, key);
			}.bind(this));
		};
		
		Object.prototype.eachValue = function(visitor) {
			Object.getOwnPropertyNames(this).forEach(function(key) {
				visitor(this[key], key);
			}.bind(this));
		};

		/**
		 * Traverses each of the elements in this array.
		 */
		Array.prototype.eachValue = Array.prototype.forEach;
	}
})();
