Array.prototype.from4Arrayto32Int = function()
{
  // 要素数4の配列から32ビットの数値をつくる

  return ((this[0] << 24) | (this[1] << 16) | (this[2] << 8) | this[3]);
}

Array.prototype.toStringfromCharCode = function()
{
	var res = "";
	for (var i = 0; i < this.length; i++) res += String.fromCharCode(this[i]);
	return res;
}
