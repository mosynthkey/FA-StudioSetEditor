// 汎用
Uint8Array.prototype.cmphead = function(ary)
{
  // 先頭からn番目の要素まで比較する
  var n = ary.length;
	if (n > this.length) return false;

	for (var i = 0; i < n; i++) {
		if (this[i] != ary[i]) return false;
	}

	return true;
};

Uint8Array.prototype.cmptail = function(ary)
{
  // 末尾からn番目の要素まで比較する
  var n = ary.length;
	if (n > this.length) return false;

	for (var i = 0; i < n; i++) {
		if (this[this.length - i] != ary[n - i]) return false;
	}

	return true;
};

Uint8Array.prototype.slice = function(start, end)
{
  var result = [];

  for (var i = start; i <= end; i++) {
    result.push(this[i]);
  }

  return result;
}
