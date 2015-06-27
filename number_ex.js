Number.prototype.to4Array = function()
{
  var mask = 0xff000000;
  var result = [];
  for (i = 24; i >= 0; i -= 8) {
    result.push(((this & mask) >> i) & 0xff)
    mask >>= 8;
  }
  return result;
}
