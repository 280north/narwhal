// Format a Date object as a string according to a subset of the ISO-8601 standard.
// Useful in Atom.
Date.prototype.toISOString = function() {
	return (this.getFullYear() + "-" + this.getMonth() + "-" + this.getDate() + "T" + this.getHours() + ":" + this.getMinutes() + ":" + this.getSeconds() + "Z"); 
}

